const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');

// list all lessons
router.get('/', async (req, res, next) => {
  try {
    const lessons = await contentStore.getLessons();
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

// get lesson by id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lesson = await contentStore.getLessonById(id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
