const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// basic request logger
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// API routes
const lessonsRouter = require('./routes/lessons');
const quizzesRouter = require('./routes/quizzes');
const adminRouter = require('./routes/admin');

app.use('/api/lessons', lessonsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('Welcome to AWS Essentials 60-Day Learning App API!');
});

app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
