const express = require('express');
const contentStore = require('../services/contentStore');
const { validateContentPayload } = require('../services/contentValidation');

const router = express.Router();

function requireAdminToken(req, res, next) {
  const expectedToken = process.env.ADMIN_WRITE_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({ error: 'ADMIN_WRITE_TOKEN is not configured' });
  }

  const providedToken = req.get('x-admin-token');
  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

router.use(requireAdminToken);

router.get('/content', async (req, res, next) => {
  try {
    const [lessons, quizzes] = await Promise.all([
      contentStore.getLessons(),
      contentStore.getQuizzes()
    ]);
    res.json({
      lessons,
      quizzes
    });
  } catch (error) {
    next(error);
  }
});

router.put('/content', async (req, res, next) => {
  try {
    const validationErrors = validateContentPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    await contentStore.setContent(req.body.lessons, req.body.quizzes);
    return res.json({
      ok: true,
      lessons: req.body.lessons.length,
      quizzes: req.body.quizzes.length
    });
  } catch (error) {
    next(error);
  }
});

router.post('/content/reseed', async (req, res, next) => {
  try {
    const data = await contentStore.reseedFromDefaults();
    res.json({
      ok: true,
      lessons: data.lessons.length,
      quizzes: data.quizzes.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
