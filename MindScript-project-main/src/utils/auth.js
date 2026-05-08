// Unified auth system: Syncs browser localStorage with a JSON file on the Python backend
// This allows data to persist in the repository while maintaining offline fallback.

const API_BASE = "http://localhost:8000";

const USERS_KEY = 'mindscript_users';
const SESSION_KEY = 'mindscript_session';
const SCORES_PREFIX = 'mindscript_scores_';
const CONVERSATIONS_PREFIX = 'mindscript_conversations_';

// --- API Helpers ---

async function apiGet(key) {
  try {
    const res = await fetch(`${API_BASE}/storage/${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.value;
  } catch (err) {
    return null;
  }
}

async function apiSet(key, value) {
  try {
    await fetch(`${API_BASE}/storage/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
  } catch (err) {}
}

async function apiBatchSet(data) {
  try {
    await fetch(`${API_BASE}/storage-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
  } catch (err) {}
}

// --- Migration Logic ---

export async function migrateToBackend() {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) return;

  console.log("MindScript: Found local data, migrating to backend file system...");
  const dataToMigrate = {
    [USERS_KEY]: JSON.parse(users)
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(SCORES_PREFIX) || key.startsWith(CONVERSATIONS_PREFIX))) {
      try {
        dataToMigrate[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {}
    }
  }

  await apiBatchSet(dataToMigrate);
  
  // Clean up localStorage after migration
  Object.keys(dataToMigrate).forEach(k => localStorage.removeItem(k));
  console.log("MindScript: Migration to backend file system complete!");
}

// --- Auth Implementation ---

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getUsers() {
  // Priority: Backend API -> localStorage
  const backendUsers = await apiGet(USERS_KEY);
  if (backendUsers) return backendUsers;
  
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

async function saveUsers(users) {
  // Save to both for safety
  await apiSet(USERS_KEY, users);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(name, email, password) {
  const users = await getUsers();
  const key = email.toLowerCase().trim();

  if (users[key]) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const hash = await hashPassword(password, salt);

  users[key] = { name: name.trim(), email: key, salt, hash, createdAt: Date.now() };
  await saveUsers(users);

  return { success: true, user: { name: name.trim(), email: key } };
}

export async function loginUser(email, password) {
  const users = await getUsers();
  const key = email.toLowerCase().trim();
  const user = users[key];

  if (!user) {
    return { success: false, error: 'No account found with this email.' };
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) {
    return { success: false, error: 'Incorrect password.' };
  }

  return { success: true, user: { name: user.name, email: user.email } };
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Data Persistence per User ---

export async function getUserScores(email) {
  const key = SCORES_PREFIX + email.toLowerCase().trim();
  const scores = await apiGet(key) || JSON.parse(localStorage.getItem(key) || '[]');
  
  return Array.isArray(scores)
    ? scores.map(record => ({
      ...record,
      score: typeof record.score === 'number' && record.score > 1
        ? Number((record.score / 100).toFixed(2))
        : record.score,
    }))
    : [];
}

export async function saveUserScore(email, scoreRecord) {
  const key = SCORES_PREFIX + email.toLowerCase().trim();
  const scores = await getUserScores(email);
  const score = typeof scoreRecord.score === 'number' && scoreRecord.score > 1
    ? Number((scoreRecord.score / 100).toFixed(2))
    : scoreRecord.score;
    
  scores.push({ ...scoreRecord, score, timestamp: Date.now() });
  
  await apiSet(key, scores);
  localStorage.setItem(key, JSON.stringify(scores));
  return scores;
}

export async function getUserConversation(email) {
  const key = CONVERSATIONS_PREFIX + email.toLowerCase().trim();
  return await apiGet(key) || JSON.parse(localStorage.getItem(key) || '[]');
}

export async function saveUserConversation(email, conversation) {
  const key = CONVERSATIONS_PREFIX + email.toLowerCase().trim();
  const normalized = Array.isArray(conversation) ? conversation : [];
  
  await apiSet(key, normalized);
  localStorage.setItem(key, JSON.stringify(normalized));
  return normalized;
}
