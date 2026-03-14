function LessonDetailView({
  selectedLesson,
  lessons,
  quizzes,
  quizLoading,
  quizError,
  quizState,
  onGoHome,
  onBackToLessons,
  onSelectLesson,
  onFilterPathSelect,
  onAnswerSingle,
  onMultiToggle,
  onMultiSubmit,
  onDragStart,
  onDrop,
  onAllowDrop,
  onGradeDrag
}) {
  const sortedLessons = [...lessons].sort((a, b) => a.day - b.day);
  const selectedIndex = sortedLessons.findIndex((lesson) => lesson.id === selectedLesson.id);
  const previousLesson = selectedIndex > 0 ? sortedLessons[selectedIndex - 1] : null;
  const nextLesson = selectedIndex < sortedLessons.length - 1 ? sortedLessons[selectedIndex + 1] : null;

  return (
    <section className="lesson-detail">
      <div className="breadcrumbs">
        <button type="button" className="crumb" onClick={onGoHome}>Home</button>
        <span className="breadcrumb-separator">{'>'}</span>
        <button type="button" className="crumb" onClick={onBackToLessons}>Lessons</button>
        {selectedLesson.path && (
          <>
            <span className="breadcrumb-separator">{'>'}</span>
            <button type="button" className="crumb" onClick={() => onFilterPathSelect(selectedLesson.path)}>
              {selectedLesson.path}
            </button>
          </>
        )}
        <span className="breadcrumb-separator">{'>'}</span>
        <span className="current">Day {selectedLesson.day}</span>
      </div>

      <button onClick={onBackToLessons} className="back-btn">Back to Lessons</button>

      <div className="lesson-header">
        <h2>{selectedLesson.title}</h2>
        <span className="day-badge">Day {selectedLesson.day}</span>
      </div>

      <div className="lesson-meta">
        {selectedLesson.estimatedTime && (
          <div className="meta-item">
            <strong>Estimated Time:</strong> {selectedLesson.estimatedTime} minutes
          </div>
        )}

        {selectedLesson.prerequisites && selectedLesson.prerequisites.length > 0 && (
          <div className="meta-item prerequisites">
            <strong>Prerequisites:</strong>
            <div className="prerequisite-list">
              {selectedLesson.prerequisites.map((id) => {
                const prerequisiteLesson = lessons.find((lesson) => lesson.id === id);
                return prerequisiteLesson ? (
                  <button
                    key={id}
                    type="button"
                    className="prerequisite-tag"
                    onClick={() => onSelectLesson(prerequisiteLesson)}
                  >
                    Day {prerequisiteLesson.day}: {prerequisiteLesson.title}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {selectedLesson.relatedServices && selectedLesson.relatedServices.length > 0 && (
          <div className="meta-item">
            <strong>Related Services:</strong> {selectedLesson.relatedServices.join(', ')}
          </div>
        )}
      </div>

      <div className="lesson-content">
        <h3>Overview</h3>
        <p className="description">{selectedLesson.content}</p>

        {selectedLesson.useCase && (
          <div className="use-case-box">
            <h4>Real-World Use Case</h4>
            <p>{selectedLesson.useCase}</p>
          </div>
        )}

        {selectedLesson.pitfalls && selectedLesson.pitfalls.length > 0 && (
          <div className="pitfalls-box">
            <h4>Common Pitfalls</h4>
            <ul>
              {selectedLesson.pitfalls.map((pitfall, index) => (
                <li key={index}>{pitfall}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedLesson.keyPoints && selectedLesson.keyPoints.length > 0 && (
          <div className="key-points">
            <h4>Key Points</h4>
            <ul>
              {selectedLesson.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedLesson.resources && selectedLesson.resources.length > 0 && (
          <div className="resources">
            <h4>Resources and Documentation</h4>
            <div className="resource-grid">
              {selectedLesson.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <span className="resource-type">{resource.type ? resource.type.toUpperCase() : 'LINK'}</span>
                  <span className="resource-title">{resource.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lesson-nav-buttons">
        <div className="nav-links">
          {previousLesson && (
            <button onClick={() => onSelectLesson(previousLesson)}>
              Previous (Day {previousLesson.day})
            </button>
          )}
          {nextLesson && (
            <button onClick={() => onSelectLesson(nextLesson)}>
              Next (Day {nextLesson.day})
            </button>
          )}
        </div>
      </div>

      {quizLoading && <div className="loading-panel">Loading lesson assessment...</div>}
      {quizError && <div className="error-panel">{quizError}</div>}

      {quizzes.length > 0 && !quizLoading && (
        <div className="quiz-section">
          <h3>Assessment ({quizzes.length} question{quizzes.length > 1 ? 's' : ''})</h3>
          {quizzes.map((quiz) => {
            const state = quizState[quiz.id] || {};
            return (
              <div key={quiz.id} className={`quiz-item ${state.answered ? 'answered' : ''}`}>
                <p className="question">{quiz.question}</p>

                {(!quiz.type || quiz.type === 'single') && (
                  <div className="options">
                    {quiz.options.map((option, index) => {
                      const isSelected = state.selected === option;
                      const isCorrect = option === quiz.answer;
                      let optionClass = 'option';

                      if (state.answered) {
                        if (isCorrect) optionClass += ' correct';
                        else if (isSelected) optionClass += ' incorrect';
                        else optionClass += ' disabled';
                      }

                      return (
                        <button
                          key={index}
                          className={optionClass}
                          onClick={() => !state.answered && onAnswerSingle(quiz.id, option)}
                          disabled={state.answered}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {quiz.type === 'multi' && (
                  <div className="options multi">
                    {quiz.options.map((option, index) => {
                      const checked = state.selected && state.selected.includes(option);
                      return (
                        <label key={index} className="option multi-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={state.answered}
                            onChange={() => !state.answered && onMultiToggle(quiz.id, option)}
                          />
                          {option}
                        </label>
                      );
                    })}
                    {!state.answered && (
                      <button onClick={() => onMultiSubmit(quiz.id)} className="submit-btn">Submit</button>
                    )}
                  </div>
                )}

                {quiz.type === 'drag' && (
                  <div className="options drag-list">
                    {state.selectedOrder && state.selectedOrder.map((option, index) => (
                      <div
                        key={`${option}-${index}`}
                        className="drag-item"
                        draggable={!state.answered}
                        onDragStart={(event) => onDragStart(event, index)}
                        onDragOver={onAllowDrop}
                        onDrop={(event) => onDrop(event, quiz.id, index)}
                      >
                        {option}
                      </div>
                    ))}
                    {!state.answered && (
                      <button onClick={() => onGradeDrag(quiz.id)} className="submit-btn">Grade</button>
                    )}
                  </div>
                )}

                {state.answered && (
                  <div className={`feedback ${state.isCorrect ? 'success' : 'failure'}`}>
                    <strong>{state.isCorrect ? 'Correct' : 'Incorrect'}</strong>
                    <p className="explanation">{quiz.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default LessonDetailView;
