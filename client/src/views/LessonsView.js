function LessonsView({
  lessons,
  lessonsLoading,
  lessonsError,
  filterPath,
  paths,
  progress,
  recommendedLessonId,
  onFilterPathChange,
  onSelectLesson
}) {
  const visibleLessons = lessons
    .filter((lesson) => filterPath === 'All' || lesson.path === filterPath)
    .sort((a, b) => a.day - b.day);
  const completedVisibleLessons = visibleLessons.filter((lesson) => progress[lesson.id]).length;

  return (
    <section className="lessons-grid">
      <div className="lessons-header">
        <div>
          <h2>Lessons {lessonsLoading ? '(loading...)' : `(${visibleLessons.length})`}</h2>
          <p className="section-intro">
            Browse the curriculum by track and jump into the next lesson you want to showcase.
          </p>
        </div>
        <div className="filter-bar">
          <label htmlFor="path-filter">Category:</label>
          <select id="path-filter" value={filterPath} onChange={(e) => onFilterPathChange(e.target.value)}>
            {paths.map((path) => (
              <option key={path} value={path}>{path}</option>
            ))}
          </select>
        </div>
      </div>

      {lessonsError && <div className="error-panel">{lessonsError}</div>}
      {lessonsLoading && <div className="loading-panel">Loading curriculum...</div>}

      {!lessonsLoading && !lessonsError && (
        <div className="lesson-summary-strip">
          <div className="summary-card">
            <strong>{visibleLessons.length}</strong>
            <span>Visible lessons</span>
          </div>
          <div className="summary-card">
            <strong>{completedVisibleLessons}</strong>
            <span>Completed in this track</span>
          </div>
          <div className="summary-card">
            <strong>{filterPath}</strong>
            <span>Active filter</span>
          </div>
        </div>
      )}

      <div className="grid">
        {visibleLessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className={`lesson-card ${recommendedLessonId === lesson.id ? 'recommended' : ''}`}
              onClick={() => onSelectLesson(lesson)}
            >
              <div className="lesson-card-top">
                <span className="day-badge">Day {lesson.day}</span>
                {recommendedLessonId === lesson.id && <span className="recommended-badge">Start Here</span>}
              </div>
              {lesson.path && <span className="path-tag">{lesson.path}</span>}
              <h3>{lesson.title}</h3>
              <p>{lesson.content.substring(0, 120)}...</p>
              <div className="lesson-card-footer">
                <span>{lesson.estimatedTime ? `${lesson.estimatedTime} min` : 'Self-paced'}</span>
                <span>{progress[lesson.id] ? 'Reviewed' : 'Open lesson'}</span>
              </div>
              {progress[lesson.id] && <span className="badge-done">Done</span>}
            </button>
        ))}
      </div>

      {!lessonsLoading && visibleLessons.length === 0 && !lessonsError && (
        <div className="empty-panel">No lessons match this category yet.</div>
      )}
    </section>
  );
}

export default LessonsView;
