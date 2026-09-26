import { readFileSync } from 'node:fs';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${path}: ${error.message}`);
  }
}

function requireString(value, field, recordId) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${recordId}: "${field}" must be a non-empty string.`);
  }
}

function validateAcceptedAnswers(value, recordId) {
  if (
    value !== undefined &&
    (!Array.isArray(value) || value.some((answer) => typeof answer !== 'string' || !answer.trim()))
  ) {
    throw new Error(`${recordId}: "acceptedAnswers" must contain only non-empty strings.`);
  }
}

function validateUniqueId(record, ids, context) {
  requireString(record.id, 'id', context);
  if (ids.has(record.id)) {
    throw new Error(`${context}: duplicate ID "${record.id}".`);
  }
  ids.add(record.id);
}

const questions = readJson('../src/assets/data/questions.json');
const exercises = readJson('../src/assets/data/image-exercises.json');

if (!Array.isArray(questions) || !Array.isArray(exercises)) {
  throw new Error('Question and image exercise data must both be JSON arrays.');
}

const ids = new Set();

for (const question of questions) {
  validateUniqueId(question, ids, 'Text question');
  requireString(question.question, 'question', question.id);
  requireString(question.answer, 'answer', question.id);
  validateAcceptedAnswers(question.acceptedAnswers, question.id);
}

for (const exercise of exercises) {
  validateUniqueId(exercise, ids, 'Image exercise');
  requireString(exercise.image, 'image', exercise.id);

  let imageUrl;
  try {
    imageUrl = new URL(exercise.image);
  } catch {
    throw new Error(`${exercise.id}: "image" must be a valid HTTPS Cloudinary URL.`);
  }
  if (
    imageUrl.protocol !== 'https:' ||
    imageUrl.hostname !== 'res.cloudinary.com' ||
    !/^\/[^/]+\/image\/upload\/.+/.test(imageUrl.pathname)
  ) {
    throw new Error(`${exercise.id}: "image" must be a valid HTTPS Cloudinary image URL.`);
  }
  if (!Array.isArray(exercise.questions) || exercise.questions.length === 0) {
    throw new Error(`${exercise.id}: "questions" must contain at least one question.`);
  }

  for (const question of exercise.questions) {
    validateUniqueId(question, ids, `Image exercise "${exercise.id}" question`);
    requireString(question.question, 'question', question.id);
    requireString(question.answer, 'answer', question.id);
    validateAcceptedAnswers(question.acceptedAnswers, question.id);
  }
}

console.log(`Validated ${questions.length} text questions and ${exercises.length} image exercises.`);
