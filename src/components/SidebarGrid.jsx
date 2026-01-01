import './SidebarGrid.css'

function SidebarGrid({
  totalQuestions,
  currentIndex,
  answers,
  questions,
  visitedQuestions,
  markedQuestions,
  onQuestionJump
}) {
  function getQuestionStatus(index) {
    const question = questions[index]
    if (!question) return 'unvisited'

    const hasAnswer = answers[question.id] !== undefined
    const isVisited = visitedQuestions.has(index)
    const isMarked = markedQuestions.has(index)

    if (index === currentIndex) return 'active'
    if (isMarked) return 'marked'
    if (hasAnswer) return 'answered'
    if (isVisited) return 'visited'
    return 'unvisited'
  }

  return (
    <aside className="sidebar-grid">
      <div className="sidebar-header">
        <h3 className="bengali">প্রশ্ন নেভিগেশন</h3>
        <div className="status-legend-grid">
          <div className="status-item unvisited">
            <div className="status-indicator"></div>
            <span className="status-label">অদেখা</span>
          </div>
          <div className="status-item visited">
            <div className="status-indicator"></div>
            <span className="status-label">দেখা</span>
          </div>
          <div className="status-item answered">
            <div className="status-indicator"></div>
            <span className="status-label">উত্তর</span>
          </div>
          <div className="status-item marked">
            <div className="status-indicator"></div>
            <span className="status-label">রিভিউ</span>
          </div>
        </div>
      </div>
      <div className="questions-grid">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const status = getQuestionStatus(i)
          return (
            <button
              key={i}
              className={`question-bubble ${status}`}
              onClick={() => onQuestionJump(i)}
              title={`প্রশ্ন ${i + 1}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default SidebarGrid


