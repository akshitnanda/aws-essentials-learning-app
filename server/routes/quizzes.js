const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');

// get quizzes, optionally filtered by lessonId
router.get('/', async (req, res, next) => {
  try {
    const lessonIdParam = req.query.lessonId;
    const lessonId = lessonIdParam ? parseInt(lessonIdParam, 10) : null;
    const quizzes = await contentStore.getQuizzes(Number.isNaN(lessonId) ? null : lessonId);
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
