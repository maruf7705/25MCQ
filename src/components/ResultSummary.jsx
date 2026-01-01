import { useState, useEffect, useRef } from 'react'
import SubmissionStatus from './SubmissionStatus'
import AchievementBadge from './AchievementBadge'
import PerformanceChart from './PerformanceChart'
import './ResultSummary.css'

function ResultSummary({ questions, answers, studentName, score, onRestart, questionFile, submissionStatus }) {
  const { score: totalScore, correct, wrong, attempted, total } = score
  const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : 0
  const unanswered = total - attempted
  const pass = totalScore >= 12.5
  const [solutions, setSolutions] = useState([])
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [filter, setFilter] = useState('all')
  const [animatedCorrect, setAnimatedCorrect] = useState(0)
  const [animatedWrong, setAnimatedWrong] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    loadSolutions()
    if (!hasAnimated.current) {
      hasAnimated.current = true
      animateCounter(setAnimatedCorrect, correct)
      animateCounter(setAnimatedWrong, wrong)
    }
  }, [])

  function animateCounter(setter, target) {
    const duration = 1000
    const steps = 30
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        setter(target)
        clearInterval(interval)
      } else {
        setter(Math.floor(current))
      }
    }, duration / steps)
  }

  async function loadSolutions() {
    try {
      const qFile = questionFile || 'questions.json'
      let baseName = qFile.replace('.json', '').replace(/\s+/g, '')
      const answerFile = baseName + '-Answer.json'
      const res = await fetch(`/${answerFile}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setSolutions(data)
    } catch (err) {
      console.log('Could not load solutions:', err)
    }
  }

  function getSolution(questionId) {
    return solutions.find(s => s.id === questionId || s.id.toString() === questionId.toString())?.solution || null
  }

  function toggleExpand(questionId) {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  function getCongratulatoryMessage() {
    if (accuracy >= 90) return 'অসাধারণ! তুমি চমৎকার করেছো!'
    if (accuracy >= 75) return 'খুব ভালো! চমৎকার কাজ!'
    if (accuracy >= 60) return 'ভালো করেছো! এগিয়ে চলো!'
    if (pass) return 'পাস করেছো! অভিনন্দন!'
    return 'পরবর্তীতে আরও ভাল করবে!'
  }

  function getFilteredQuestions() {
    return questions.filter((q) => {
      const selected = answers[q.id]
      const isCorrect = selected === q.correctOptionId
      const hasAnswer = selected !== undefined

      if (filter === 'correct') return isCorrect
      if (filter === 'wrong') return hasAnswer && !isCorrect
      if (filter === 'unanswered') return !hasAnswer
      return true
    })
  }

  return (
    <div className="result-summary">
      <div className="result-card">
        <div className="result-header">
          <h1 className="bengali">পরীক্ষা সম্পন্ন</h1>
          <p className="student-name bengali">{studentName}</p>
          <p className="congratulations-message bengali">{getCongratulatoryMessage()}</p>
        </div>

        <AchievementBadge score={totalScore} accuracy={parseFloat(accuracy)} />

        <div className="score-and-chart-container">
          <div className={`score-display ${pass ? 'pass' : 'fail'}`}>
            <div className="progress-ring">
              <svg className="progress-svg" viewBox="0 0 200 200">
                <circle
                  className="progress-circle-bg"
                  cx="100"
                  cy="100"
                  r="85"
                />
                <circle
                  className="progress-circle"
                  cx="100"
                  cy="100"
                  r="85"
                  style={{
                    strokeDasharray: `${(totalScore / 31.25) * 534} 534`
                  }}
                />
              </svg>
              <div className="score-content">
                <div className="score-value">{totalScore.toFixed(2)}</div>
                <div className="score-label bengali">মোট: {total}</div>
              </div>
            </div>
            <div className={`status-badge ${pass ? 'pass' : 'fail'}`}>
              {pass ? 'পাস' : 'ফেল'}
            </div>
          </div>

          <PerformanceChart
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
          />
        </div>

        <div className="stats-grid">
          <div className="stat-item correct-stat">
            <div className="stat-value correct">{animatedCorrect}</div>
            <div className="stat-label bengali">সঠিক</div>
          </div>
          <div className="stat-item wrong-stat">
            <div className="stat-value wrong">{animatedWrong}</div>
            <div className="stat-label bengali">ভুল</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{attempted}</div>
            <div className="stat-label bengali">চেষ্টা</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label bengali">সঠিকতা</div>
          </div>
        </div>

        <div className="answers-review">
          <h2 className="bengali">উত্তর পর্যালোচনা</h2>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span className="bengali">সব ({questions.length})</span>
            </button>
            <button
              className={`filter-btn ${filter === 'correct' ? 'active' : ''}`}
              onClick={() => setFilter('correct')}
            >
              <span className="bengali">সঠিক ({correct})</span>
            </button>
            <button
              className={`filter-btn ${filter === 'wrong' ? 'active' : ''}`}
              onClick={() => setFilter('wrong')}
            >
              <span className="bengali">ভুল ({wrong})</span>
            </button>
            <button
              className={`filter-btn ${filter === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilter('unanswered')}
            >
              <span className="bengali">উত্তরহীন ({unanswered})</span>
            </button>
          </div>

          <div className="answers-list">
            {getFilteredQuestions().map((q, idx) => {
              const selected = answers[q.id]
              const isCorrect = selected === q.correctOptionId
              const hasAnswer = selected !== undefined

              return (
                <div key={q.id} className={`answer-item ${isCorrect ? 'correct' : hasAnswer ? 'wrong' : 'unanswered'}`}>
                  <div className="answer-header">
                    <span className="question-num bengali">প্রশ্ন {idx + 1}</span>
                    {isCorrect && <span className="icon-check"></span>}
                    {hasAnswer && !isCorrect && <span className="icon-cross"></span>}
                    {!hasAnswer && <span className="icon-dash"></span>}
                  </div>
                  <div className="question-text bengali">{q.question}</div>
                  <div className="answer-details">
                    {hasAnswer ? (
                      <>
                        <span className="bengali">আপনার উত্তর: {selected}</span>
                        <span className="bengali">সঠিক উত্তর: {q.correctOptionId}</span>
                      </>
                    ) : (
                      <span className="bengali">উত্তর দেওয়া হয়নি</span>
                    )}
                  </div>

                  {getSolution(q.id) && (
                    <div className="solution-toggle-section">
                      <button
                        className="solution-toggle-btn bengali"
                        onClick={() => toggleExpand(q.id)}
                      >
                        {expandedQuestion === q.id ? '▼ সমাধান লুকান' : '▶ সমাধান দেখুন'}
                      </button>
                      {expandedQuestion === q.id && (
                        <div className="solution-box">
                          <div className="solution-header bengali">
                            <strong>সমাধান/ব্যাখ্যা</strong>
                          </div>
                          <div className="solution-text bengali">
                            {getSolution(q.id)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <button className="restart-btn bengali" onClick={onRestart}>
          নতুন পরীক্ষা শুরু করুন
        </button>
      </div>

      <SubmissionStatus {...submissionStatus} />
    </div>
  )
}

export default ResultSummary
