export const MOOD_QUOTES = [
  "You are stronger than you know.",
  "This too shall pass.",
  "One day at a time.",
  "Your feelings are valid.",
  "Small steps are still progress.",
  "Breathe. You have got this.",
  "It is okay not to be okay.",
  "You are worthy of happiness.",
  "Focus on the present moment.",
  "Healing is a journey, not a race."
];

// Expanded pool of assessment questions - more than 15 for randomization
export const ASSESSMENT_QUESTIONS_POOL = [
  "I have felt cheerful and in good spirits.",
  "I have felt calm and relaxed.",
  "I have felt active and vigorous.",
  "I woke up feeling fresh and rested.",
  "My daily life has been filled with things that interest me.",
  "I have felt tense or anxious.",
  "I have felt lonely.",
  "I have found it hard to focus on tasks.",
  "I have worried about things I cannot control.",
  "I have had trouble sleeping.",
  "I have lost interest in my appearance.",
  "I have felt easily annoyed or irritated.",
  "I have felt that everything was an effort.",
  "I have felt that life is not worth living.",
  "I have felt hopeful about the future.",
  "I have enjoyed spending time with others.",
  "I have felt confident in my abilities.",
  "I have found pleasure in simple things.",
  "I have felt overwhelmed by responsibilities.",
  "I have had difficulty making decisions.",
  "I have felt physically tired or drained.",
  "I have experienced changes in my appetite.",
  "I have felt disconnected from my emotions.",
  "I have had thoughts of harming myself.",
  "I have felt grateful for what I have.",
  "I have felt motivated to achieve my goals.",
  "I have felt supported by my loved ones.",
  "I have experienced racing thoughts.",
  "I have felt inadequate or worthless.",
  "I have had trouble relaxing even when trying.",
  "I have felt excited about new opportunities.",
  "I have felt at peace with myself.",
  "I have struggled with feelings of guilt.",
  "I have felt energetic and full of life.",
  "I have worried excessively about health.",
  "I have felt isolated from others.",
  "I have had difficulty concentrating on reading.",
  "I have felt that others don't understand me.",
  "I have experienced mood swings.",
  "I have felt proud of my accomplishments."
];

// Function to get randomized 15 questions
export const ASSESSMENT_OPTION_LABELS = [
  '0 Never',
  '1 Rarely',
  '2 Sometimes',
  '3 Often',
  '4 Always',
];

export const getRandomizedAssessmentQuestions = () => {
  const shuffled = [...ASSESSMENT_QUESTIONS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 15);
};

// Legacy export for backward compatibility
export const ASSESSMENT_QUESTIONS = ASSESSMENT_QUESTIONS_POOL.slice(0, 14);
