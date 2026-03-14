# AWS Essentials Learning App

A portfolio-friendly AWS learning demo with a React frontend and an Express backend. The app combines a 60-day curriculum, lesson assessments, progress tracking, and a safe mock lab so people can explore the experience without pasting real AWS credentials into the browser.

## Why this is demo-ready

- Guided 60-day AWS curriculum with lesson categories and prerequisites
- Quiz support for single-answer, multi-select, and drag-order questions
- Local progress persistence with completion tracking
- Demo lab mode with mock S3, EC2, and DynamoDB resources
- Optional live AWS mode for personal experimentation
- Admin API for reseeding or replacing lesson and quiz content

## Tech stack

- Frontend: React
- Backend: Node.js, Express
- Tooling: `concurrently`, `nodemon`
- Storage: JSON files in `server/storage`

## Project structure

```text
client/   React app
server/   Express API, content validation, JSON storage
```

## Running locally

### 1. Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 2. Configure the backend

```bash
copy server\\.env.example server\\.env
```

Set `ADMIN_WRITE_TOKEN` in `server/.env`.

### 3. Start the app

```bash
npm run dev
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Open In Codespaces

This repo now includes a Codespaces/devcontainer setup, so you can run it in GitHub without local Node tooling.

Codespaces workflow:

1. Open the repository in GitHub Codespaces.
2. Wait for the post-create install step to finish.
3. Run `npm run dev`.
4. Open port `3000` for the React app. Port `5000` is the API.

The best public demo path in Codespaces is still the built-in demo lab mode, since it avoids real AWS credentials entirely.

## Public Demo

This repository is set up to deploy a static demo build to GitHub Pages from the `main` branch.

Expected demo URL:

- `https://akshitnanda.github.io/aws-essentials-learning-app/`

The deployed build uses bundled lesson and quiz data plus the in-browser demo lab mode, so it works without the Express API.

### 4. Reset content from seed data

```bash
npm run reseed
```

## Demo mode vs live mode

The lab supports two workflows:

- Demo mode: uses local mock data, safe for GitHub demos, interviews, and walkthrough videos
- Live mode: connects directly to AWS with real credentials stored only in browser memory

Use demo mode if you want people to try the project without an AWS account.

## Available scripts

From the repo root:

```bash
npm run dev
npm run test
npm run reseed
```

From the client:

```bash
npm --prefix client run build
```

## API

Public:

- `GET /api/lessons`
- `GET /api/lessons/:id`
- `GET /api/quizzes`
- `GET /api/quizzes?lessonId=1`

Admin:

- `GET /api/admin/content`
- `PUT /api/admin/content`
- `POST /api/admin/content/reseed`

Admin routes require header `x-admin-token: <ADMIN_WRITE_TOKEN>`.

`PUT /api/admin/content` expects:

```json
{
  "lessons": [],
  "quizzes": []
}
```

The backend validates shape, uniqueness, and quiz-to-lesson references before writing to storage.

## Making this a strong GitHub demo

- Add screenshots or a short GIF of the home page, lessons view, and demo lab
- Keep demo mode as the default path in any walkthrough
- Write a short project description in your GitHub repo summary
- Add a license before publishing if you want others to reuse the code
- Mention that the project can be launched in GitHub Codespaces for zero local setup
- Create a clean first commit after `git init`

## Automation

The repo includes:

- CI on pushes and pull requests
- GitHub Pages deployment for the static demo
- Dependabot for dependency and workflow updates
- Markdown link checks for README files

Suggested Git commands:

```bash
git init
git add .
git commit -m "Initial demo-ready AWS learning app"
```
