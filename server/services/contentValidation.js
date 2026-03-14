function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasUniqueValues(values) {
  return new Set(values).size === values.length;
}

function validateLessons(lessons) {
  const errors = [];

  if (!Array.isArray(lessons)) {
    return ['`lessons` must be an array'];
  }

  const ids = [];
  const days = [];

  lessons.forEach((lesson, index) => {
    const path = `lessons[${index}]`;
    if (!lesson || typeof lesson !== 'object') {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!Number.isInteger(lesson.id) || lesson.id <= 0) {
      errors.push(`${path}.id must be a positive integer`);
    } else {
      ids.push(lesson.id);
    }

    if (!Number.isInteger(lesson.day) || lesson.day <= 0) {
      errors.push(`${path}.day must be a positive integer`);
    } else {
      days.push(lesson.day);
    }

    if (lesson.title !== undefined && typeof lesson.title !== 'string') {
      errors.push(`${path}.title must be a string when provided`);
    }

    if (!isNonEmptyString(lesson.content)) {
      errors.push(`${path}.content must be a non-empty string`);
    }

    if (lesson.path !== undefined && typeof lesson.path !== 'string') {
      errors.push(`${path}.path must be a string when provided`);
    }

    if (lesson.prerequisites !== undefined) {
      const validPrerequisites = Array.isArray(lesson.prerequisites)
        && lesson.prerequisites.every((id) => Number.isInteger(id) && id > 0);
      if (!validPrerequisites) {
        errors.push(`${path}.prerequisites must be an array of positive integers`);
      }
    }

    if (lesson.estimatedTime !== undefined && (!Number.isFinite(lesson.estimatedTime) || lesson.estimatedTime <= 0)) {
      errors.push(`${path}.estimatedTime must be a positive number when provided`);
    }

    ['pitfalls', 'relatedServices', 'keyPoints'].forEach((key) => {
      if (lesson[key] !== undefined && !isStringArray(lesson[key])) {
        errors.push(`${path}.${key} must be an array of strings`);
      }
    });

    if (lesson.resources !== undefined) {
      if (!Array.isArray(lesson.resources)) {
        errors.push(`${path}.resources must be an array`);
      } else {
        lesson.resources.forEach((resource, resourceIndex) => {
          const resourcePath = `${path}.resources[${resourceIndex}]`;
          if (!resource || typeof resource !== 'object') {
            errors.push(`${resourcePath} must be an object`);
            return;
          }
          if (!isNonEmptyString(resource.title)) {
            errors.push(`${resourcePath}.title must be a non-empty string`);
          }
          if (!isNonEmptyString(resource.url)) {
            errors.push(`${resourcePath}.url must be a non-empty string`);
          }
          if (resource.type !== undefined && typeof resource.type !== 'string') {
            errors.push(`${resourcePath}.type must be a string when provided`);
          }
        });
      }
    }
  });

  if (!hasUniqueValues(ids)) {
    errors.push('lesson ids must be unique');
  }
  if (!hasUniqueValues(days)) {
    errors.push('lesson days must be unique');
  }

  return errors;
}

function validateQuizzes(quizzes) {
  const errors = [];

  if (!Array.isArray(quizzes)) {
    return ['`quizzes` must be an array'];
  }

  const ids = [];

  quizzes.forEach((quiz, index) => {
    const path = `quizzes[${index}]`;
    if (!quiz || typeof quiz !== 'object') {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!Number.isInteger(quiz.id) || quiz.id <= 0) {
      errors.push(`${path}.id must be a positive integer`);
    } else {
      ids.push(quiz.id);
    }

    if (!Number.isInteger(quiz.lessonId) || quiz.lessonId <= 0) {
      errors.push(`${path}.lessonId must be a positive integer`);
    }

    if (!isNonEmptyString(quiz.question)) {
      errors.push(`${path}.question must be a non-empty string`);
    }

    if (!isStringArray(quiz.options) || quiz.options.length < 2) {
      errors.push(`${path}.options must be an array of at least 2 strings`);
      return;
    }

    const type = quiz.type || 'single';
    if (!['single', 'multi', 'drag'].includes(type)) {
      errors.push(`${path}.type must be one of single, multi, drag`);
      return;
    }

    if (type === 'single') {
      if (!isNonEmptyString(quiz.answer)) {
        errors.push(`${path}.answer must be a non-empty string for single-choice quiz`);
      } else if (!quiz.options.includes(quiz.answer)) {
        errors.push(`${path}.answer must match one of options`);
      }
      return;
    }

    if (type === 'multi') {
      const answers = quiz.correctAnswers;
      if (!isStringArray(answers) || answers.length === 0) {
        errors.push(`${path}.correctAnswers must be a non-empty array of strings`);
        return;
      }
      if (!hasUniqueValues(answers)) {
        errors.push(`${path}.correctAnswers must be unique`);
      }
      const allExist = answers.every((answer) => quiz.options.includes(answer));
      if (!allExist) {
        errors.push(`${path}.correctAnswers must all exist in options`);
      }
      return;
    }

    const correctOrder = quiz.correctOrder;
    if (!isStringArray(correctOrder) || correctOrder.length !== quiz.options.length) {
      errors.push(`${path}.correctOrder must be an array matching options length`);
      return;
    }
    const sameValues = hasUniqueValues(correctOrder)
      && correctOrder.every((value) => quiz.options.includes(value));
    if (!sameValues) {
      errors.push(`${path}.correctOrder must be a permutation of options`);
    }
  });

  if (!hasUniqueValues(ids)) {
    errors.push('quiz ids must be unique');
  }

  return errors;
}

function validateContentPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return ['request body must be an object with `lessons` and `quizzes`'];
  }

  errors.push(...validateLessons(payload.lessons));
  errors.push(...validateQuizzes(payload.quizzes));

  if (Array.isArray(payload.lessons) && Array.isArray(payload.quizzes)) {
    const lessonIds = new Set(payload.lessons.map((lesson) => lesson.id));
    payload.quizzes.forEach((quiz, index) => {
      if (!lessonIds.has(quiz.lessonId)) {
        errors.push(`quizzes[${index}].lessonId references missing lesson id ${quiz.lessonId}`);
      }
    });
  }

  return errors;
}

module.exports = {
  validateContentPayload
};
