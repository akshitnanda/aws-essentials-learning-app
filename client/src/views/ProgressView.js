function ProgressView({ lessons, progress, completionRate }) {
  const completedLessons = lessons
    .filter((lesson) => progress[lesson.id])
    .sort((a, b) => a.day - b.day);
  const completedCount = completedLessons.length;
  const remainingCount = lessons.length - completedCount;
  const nextLesson = lessons
    .filter((lesson) => !progress[lesson.id])
    .sort((a, b) => a.day - b.day)[0] || null;

  return (
    <section className="progress-section">
      <h2>Learning Progress</h2>
      <p className="section-intro">
        Track what you have already covered and surface the next lesson to continue the story.
      </p>
      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-number">{completionRate}%</div>
          <div className="stat-label">Complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{completedCount}</div>
          <div className="stat-label">Lessons Mastered</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{remainingCount}</div>
          <div className="stat-label">Remaining</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="filled" style={{ width: `${completionRate}%` }} />
        </div>
        <span className="progress-text">{completedCount} of {lessons.length} lessons completed</span>
      </div>

      {nextLesson && (
        <div className="next-step-card">
          <span className="next-step-label">Next recommended lesson</span>
          <h3>Day {nextLesson.day}: {nextLesson.title}</h3>
          <p>{nextLesson.content.substring(0, 160)}...</p>
        </div>
      )}

      {completedCount > 0 && (
        <div className="completed-lessons">
          <h3>Completed Lessons</h3>
          <ul>
            {completedLessons.map((lesson) => (
                <li key={lesson.id}>
                  <strong>Day {lesson.day}:</strong> {lesson.title}
                </li>
            ))}
          </ul>
        </div>
      )}

      {completedCount === 0 && (
        <div className="empty-panel">Complete a quiz correctly to start filling your progress tracker.</div>
      )}
    </section>
  );
}

export default ProgressView;
