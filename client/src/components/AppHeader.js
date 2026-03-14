function AppHeader({ view, onNavigate, lessonsCount, completionRate }) {
  return (
    <header className="App-header">
      <div className="header-topline">
        <div className="header-copy">
          <span className="header-kicker">AWS portfolio project</span>
          <h1>AWS Essentials 60-Day Program</h1>
          <p>Learn core services, validate knowledge, and demo the lab safely with mock resources.</p>
        </div>

        <div className="header-stats">
          <div className="header-stat">
            <strong>{lessonsCount}</strong>
            <span>Lessons</span>
          </div>
          <div className="header-stat">
            <strong>{completionRate}%</strong>
            <span>Completed</span>
          </div>
          <div className="header-stat">
            <strong>Demo</strong>
            <span>Lab-ready</span>
          </div>
        </div>
      </div>

      <nav className="nav">
        <button onClick={() => onNavigate('home')} className={view === 'home' ? 'active' : ''}>Home</button>
        <button onClick={() => onNavigate('lessons')} className={view === 'lessons' ? 'active' : ''}>Lessons</button>
        <button onClick={() => onNavigate('lab')} className={view === 'lab' ? 'active' : ''}>AWS Lab</button>
        <button onClick={() => onNavigate('progress')} className={view === 'progress' ? 'active' : ''}>Progress</button>
      </nav>
    </header>
  );
}

export default AppHeader;
