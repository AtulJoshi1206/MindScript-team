// Local auth system with encrypted passwords using Web Crypto API

const USERS_KEY = 'mindscript_users';
const SESSION_KEY = 'mindscript_session';
const SCORES_PREFIX = 'mindscript_scores_';

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

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(name, email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();

  if (users[key]) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const hash = await hashPassword(password, salt);

  users[key] = { name: name.trim(), email: key, salt, hash, createdAt: Date.now() };
  saveUsers(users);

  return { success: true, user: { name: name.trim(), email: key } };
}

export async function loginUser(email, password) {
  const users = getUsers();
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

// Score persistence per user
export function getUserScores(email) {
  try {
    const key = SCORES_PREFIX + email.toLowerCase().trim();
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function saveUserScore(email, scoreRecord) {
  const key = SCORES_PREFIX + email.toLowerCase().trim();
  const scores = getUserScores(email);
  scores.push({ ...scoreRecord, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(scores));
  return scores;
}
