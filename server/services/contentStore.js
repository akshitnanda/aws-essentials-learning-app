const fs = require('fs/promises');
const path = require('path');
const { lessons: seedLessons, quizzes: seedQuizzes } = require('../data');

const LESSONS_PATH = path.join(__dirname, '..', 'storage', 'lessons.json');
const QUIZZES_PATH = path.join(__dirname, '..', 'storage', 'quizzes.json');
const STORAGE_DIR = path.join(__dirname, '..', 'storage');

let cache = {
  lessons: null,
  quizzes: null
};

async function readJsonWithFallback(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallbackValue;
    }
    throw error;
  }
}

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

async function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, payload, 'utf8');
  await fs.rename(tmpPath, filePath);
}

async function ensureLoaded() {
  if (!cache.lessons || !cache.quizzes) {
    const [lessons, quizzes] = await Promise.all([
      readJsonWithFallback(LESSONS_PATH, seedLessons),
      readJsonWithFallback(QUIZZES_PATH, seedQuizzes)
    ]);

    cache = { lessons, quizzes };
  }

  return cache;
}

async function getLessons() {
  const data = await ensureLoaded();
  return data.lessons;
}

async function getLessonById(id) {
  const lessons = await getLessons();
  return lessons.find((lesson) => lesson.id === id) || null;
}

async function getQuizzes(lessonId) {
  const data = await ensureLoaded();
  if (!Number.isInteger(lessonId)) {
    return data.quizzes;
  }
  return data.quizzes.filter((quiz) => quiz.lessonId === lessonId);
}

async function setContent(lessons, quizzes) {
  await ensureStorageDir();
  await Promise.all([
    writeJsonAtomic(LESSONS_PATH, lessons),
    writeJsonAtomic(QUIZZES_PATH, quizzes)
  ]);

  cache = {
    lessons,
    quizzes
  };

  return cache;
}

async function reseedFromDefaults() {
  return setContent(seedLessons, seedQuizzes);
}

function clearCache() {
  cache = {
    lessons: null,
    quizzes: null
  };
}

module.exports = {
  getLessons,
  getLessonById,
  getQuizzes,
  setContent,
  reseedFromDefaults,
  clearCache
};
