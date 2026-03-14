const test = require('node:test');
const assert = require('node:assert/strict');

const { validateContentPayload } = require('../services/contentValidation');

function createValidPayload() {
  return {
    lessons: [
      {
        id: 1,
        day: 1,
        title: 'Intro',
        content: 'Learn the basics of AWS.',
        path: 'Foundations',
        prerequisites: [],
        estimatedTime: 30,
        keyPoints: ['Regions', 'AZs'],
        resources: [
          {
            type: 'docs',
            title: 'AWS Docs',
            url: 'https://aws.amazon.com'
          }
        ]
      }
    ],
    quizzes: [
      {
        id: 1,
        lessonId: 1,
        type: 'single',
        question: 'What does AWS stand for?',
        options: ['Amazon Web Services', 'Advanced Web Systems'],
        answer: 'Amazon Web Services',
        explanation: 'AWS stands for Amazon Web Services.'
      }
    ]
  };
}

test('accepts a valid content payload', () => {
  const errors = validateContentPayload(createValidPayload());
  assert.deepEqual(errors, []);
});

test('rejects duplicate lesson ids', () => {
  const payload = createValidPayload();
  payload.lessons.push({
    ...payload.lessons[0],
    day: 2
  });

  const errors = validateContentPayload(payload);

  assert.ok(errors.includes('lesson ids must be unique'));
});

test('rejects quizzes that reference missing lessons', () => {
  const payload = createValidPayload();
  payload.quizzes[0].lessonId = 999;

  const errors = validateContentPayload(payload);

  assert.ok(errors.includes('quizzes[0].lessonId references missing lesson id 999'));
});

test('rejects invalid multi-select answers', () => {
  const payload = createValidPayload();
  payload.quizzes[0] = {
    id: 2,
    lessonId: 1,
    type: 'multi',
    question: 'Pick the valid options.',
    options: ['EC2', 'S3'],
    correctAnswers: ['Lambda']
  };

  const errors = validateContentPayload(payload);

  assert.ok(errors.includes('quizzes[0].correctAnswers must all exist in options'));
});

test('rejects drag-order quizzes that are not a permutation', () => {
  const payload = createValidPayload();
  payload.quizzes[0] = {
    id: 3,
    lessonId: 1,
    type: 'drag',
    question: 'Order the steps.',
    options: ['One', 'Two', 'Three'],
    correctOrder: ['One', 'Two', 'Two']
  };

  const errors = validateContentPayload(payload);

  assert.ok(errors.includes('quizzes[0].correctOrder must be a permutation of options'));
});
