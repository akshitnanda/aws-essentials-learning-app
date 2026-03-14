const contentStore = require('../services/contentStore');

async function main() {
  const data = await contentStore.reseedFromDefaults();
  console.log(`Reseeded storage: ${data.lessons.length} lessons, ${data.quizzes.length} quizzes`);
}

main().catch((error) => {
  console.error('Failed to reseed storage:', error);
  process.exit(1);
});
