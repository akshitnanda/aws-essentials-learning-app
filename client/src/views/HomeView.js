function HomeView({
  lessonsCount,
  lessonsLoading,
  completionRate,
  pathCount,
  onBeginLearning,
  onOpenLab
}) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Portfolio-Ready AWS Learning Demo</span>
        <h2>Master AWS in 60 Days</h2>
        <p>
          A structured curriculum covering core AWS services, architecture patterns,
          quizzes, and a safe hands-on lab experience for demos.
        </p>
        <div className="hero-actions">
          <button onClick={onBeginLearning} className="cta-btn">Explore Lessons</button>
          <button onClick={onOpenLab} className="secondary-btn">Open Demo Lab</button>
        </div>
      </div>

      <div className="hero-stats">
        <div className="hero-stat-card">
          <strong>{lessonsLoading ? '...' : lessonsCount}</strong>
          <span>Guided lessons</span>
        </div>
        <div className="hero-stat-card">
          <strong>{pathCount}</strong>
          <span>Learning tracks</span>
        </div>
        <div className="hero-stat-card">
          <strong>{completionRate}%</strong>
          <span>Progress tracked locally</span>
        </div>
      </div>

      <div className="feature-strip">
        <div className="feature-card">
          <h3>Curriculum</h3>
          <p>Move from cloud basics to architecture, security, data, and operations.</p>
        </div>
        <div className="feature-card">
          <h3>Assessment</h3>
          <p>Check understanding with single-answer, multi-select, and drag-order quizzes.</p>
        </div>
        <div className="feature-card">
          <h3>Demo Lab</h3>
          <p>Show the experience safely with local mock AWS resources before using live credentials.</p>
        </div>
      </div>
    </section>
  );
}

export default HomeView;
