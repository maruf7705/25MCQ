import { useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { renderLatex } from '../../utils/latex'
import SubjectPerformanceChart from './SubjectPerformanceChart'
import './SubmissionsTable.css'

function SubmissionsTable({
  submissions,
  onDelete,
  onDeleteStudent,
  loading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [questions, setQuestions] = useState([])
  const [solutions, setSolutions] = useState([])

  useEffect(() => {
    if (selectedSubmission) {
      loadQuestions()
    }
  }, [selectedSubmission])

  async function loadQuestions() {
    try {
      const questionFile = selectedSubmission?.questionFile || 'questions.json'
      const res = await fetch(`/${questionFile}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load questions')
      }
      const data = await res.json()
      setQuestions(data)

      // Load corresponding answer file
      await loadSolutions(questionFile)
    } catch (err) {
      console.error('Failed to load questions:', err)
    }
  }

  async function loadSolutions(questionFile) {
    try {
      // Map question file to answer file
      // Handle: "questions - 1.json" -> "questions-1-Answer.json" (no spaces for URL compatibility)
      let baseName = questionFile.replace('.json', '')
      // Remove all spaces and normalize
      baseName = baseName.replace(/\s+/g, '')
      const answerFile = baseName + '-Answer.json'

      console.log('🔍 Loading solutions:')
      console.log('  Question file:', questionFile)
      console.log('  Base name:', baseName)
      console.log('  Answer file:', answerFile)
      console.log('  Fetching from:', `/${answerFile}`)

      const res = await fetch(`/${answerFile}`, { cache: 'no-store' })
      console.log('  Response status:', res.status, res.ok ? '✓' : '✗')
      console.log('  Content-Type:', res.headers.get('content-type'))

      if (!res.ok) {
        console.log('❌ No answer file found for:', questionFile, '-> tried:', answerFile)
        setSolutions([])
        return
      }
      const data = await res.json()
      setSolutions(data)
      console.log('✅ Loaded solutions from:', answerFile, '- Total solutions:', data.length)
    } catch (err) {
      console.log('❌ Could not load solutions:', err)
      console.log('   Error details:', err.message)
      setSolutions([])
    }
  }

  function isAnswerCorrect(questionId, studentAnswer) {
    const qid = typeof questionId === 'string' ? parseInt(questionId) : questionId
    const question = questions.find(q => q.id === qid || q.id.toString() === questionId.toString())
    if (!question) return null
    return question.correctAnswer === studentAnswer
  }

  function handleQuestionClick(questionId, studentAnswer) {
    const qid = typeof questionId === 'string' ? parseInt(questionId) : questionId
    const question = questions.find(q => q.id === qid || q.id.toString() === questionId.toString())
    const solution = solutions.find(s => s.id === qid || s.id.toString() === questionId.toString())
    if (question) {
      setSelectedQuestion({
        ...question,
        studentAnswer,
        isCorrect: question.correctAnswer === studentAnswer,
        isAnswered: studentAnswer !== undefined && studentAnswer !== null,
        solution: solution?.solution || null
      })
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getElapsedTime(timestamp) {
    const now = Date.now()
    const start = new Date(timestamp).getTime()
    const elapsed = now - start
    const minutes = Math.floor(elapsed / (1000 * 60))

    // Exam is 18 minutes, add 10 minute grace period = 28 minutes total
    const TIMEOUT_THRESHOLD = 28
    const WARNING_THRESHOLD = 18 // Show warning when approaching timeout

    return {
      minutes,
      isExpired: minutes > TIMEOUT_THRESHOLD,
      isWarning: minutes > WARNING_THRESHOLD && minutes <= TIMEOUT_THRESHOLD
    }
  }

  async function handleScreenshot() {
    try {
      const modalElement = document.querySelector('.modal-content')
      if (!modalElement) return

      // Store the original max-height and overflow styles
      const originalMaxHeight = modalElement.style.maxHeight
      const originalOverflow = modalElement.style.overflow
      const originalOverflowY = modalElement.style.overflowY

      // Temporarily remove height restrictions to capture full content
      modalElement.style.maxHeight = 'none'
      modalElement.style.overflow = 'visible'
      modalElement.style.overflowY = 'visible'

      // Wait a bit for the DOM to stabilize
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create canvas from the full modal content
      const canvas = await html2canvas(modalElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowHeight: modalElement.scrollHeight,
        height: modalElement.scrollHeight
      })

      // Restore original styles
      modalElement.style.maxHeight = originalMaxHeight
      modalElement.style.overflow = originalOverflow
      modalElement.style.overflowY = originalOverflowY

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const timestamp = new Date().toLocaleString('bn-BD', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/[/:,\s]/g, '-')

        link.href = url
        link.download = `উত্তর-বিস্তারিত-${selectedSubmission?.studentName || 'student'}-${timestamp}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Screenshot failed:', error)
      alert('স্ক্রিনশট নিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    }
  }

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="bengali">লোড হচ্ছে...</div>
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="data-table-container">
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3 className="bengali">কোন ডাটা পাওয়া যায়নি</h3>
          <p className="bengali">এখনও কোন শিক্ষার্থী পরীক্ষা দেয়নি</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="bengali">নাম</th>
              <th className="bengali">আইডি</th>
              <th className="bengali">স্কোর</th>
              <th className="bengali">স্ট্যাটাস</th>
              <th className="bengali">সময়</th>
              <th className="bengali">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, idx) => (
              <tr key={idx} className={sub.isPending ? 'pending-row' : ''}>
                <td data-label="নাম" className="bengali">{sub.studentName || 'Unknown'}</td>
                <td data-label="আইডি" className="bengali">{sub.studentId || 'N/A'}</td>
                <td data-label="স্কোর">
                  {sub.isPending ? (
                    <span className="bengali" style={{ color: '#999' }}>—</span>
                  ) : (
                    <strong>{Number(sub.score || 0).toFixed(2)}</strong>
                  )}
                </td>
                <td data-label="স্ট্যাটাস">
                  {sub.isPending ? (() => {
                    const timeInfo = getElapsedTime(sub.timestamp)
                    if (timeInfo.isExpired) {
                      return (
                        <span className="status-badge" style={{ backgroundColor: '#dc2626', color: 'white' }}>
                          ⏱️ টাইম আউট ({timeInfo.minutes} মিনিট)
                        </span>
                      )
                    } else if (timeInfo.isWarning) {
                      return (
                        <span className="status-badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                          ⚠️ পেন্ডিং ({timeInfo.minutes} মিনিট)
                        </span>
                      )
                    } else {
                      return (
                        <span className="status-badge pending">
                          ⏱️ পেন্ডিং ({timeInfo.minutes} মিনিট)
                        </span>
                      )
                    }
                  })() : (
                    <span className={`status-badge ${sub.pass ? 'pass' : 'fail'}`}>
                      {sub.pass ? 'পাস' : 'ফেল'}
                    </span>
                  )}
                </td>
                <td data-label="সময়" className="bengali">{formatDate(sub.timestamp)}</td>
                <td data-label="অ্যাকশন">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!sub.isPending && (
                      <button
                        className="action-button bengali"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        দেখুন
                      </button>
                    )}
                    {sub.isPending && (
                      <span className="bengali" style={{ color: '#999', fontSize: '12px' }}>পরীক্ষা চলছে...</span>
                    )}
                    <button
                      className="action-button danger bengali"
                      onClick={() => onDeleteStudent(sub.studentName)}
                      title="ছাত্র মুছুন"
                    >
                      ✗
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info bengali">
            দেখানো হচ্ছে {((currentPage - 1) * itemsPerPage) + 1} থেকে {Math.min(currentPage * itemsPerPage, totalItems)} টি, মোট {totalItems} টি
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="pagination-button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="detail-modal" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="bengali">
                {selectedSubmission.studentName} - উত্তর বিস্তারিত
              </h2>
              <div className="modal-header-actions">
                <button
                  className="screenshot-btn bengali"
                  onClick={handleScreenshot}
                  title="স্ক্রিনশট নিন"
                >
                  📸 স্ক্রিনশট
                </button>
                <button
                  className="close-btn"
                  onClick={() => setSelectedSubmission(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-info">
                <div className="info-item main-score">
                  <span className="info-label bengali">স্কোর:</span>
                  <span className="info-value score-large">{Number(selectedSubmission.score || 0).toFixed(2)}</span>
                  <span className="info-suffix">/ {selectedSubmission.totalMarks || 100}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">সঠিক:</span>
                  <span className="info-value correct">{selectedSubmission.correct || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">ভুল:</span>
                  <span className="info-value wrong">{selectedSubmission.wrong || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">চেষ্টা:</span>
                  <span className="info-value">{selectedSubmission.attempted || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">সময়:</span>
                  <span className="info-value">{formatDate(selectedSubmission.timestamp)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">স্ট্যাটাস:</span>
                  <span className={`info-value ${selectedSubmission.pass ? 'pass-status' : 'fail-status'}`}>
                    {selectedSubmission.pass ? '✓ পাস' : '✗ ফেল'}
                  </span>
                </div>
              </div>

              {/* Subject Performance Chart */}
              <SubjectPerformanceChart
                questions={questions}
                studentAnswers={selectedSubmission.answers || {}}
              />

              <div className="answers-detail">
                <h3 className="bengali">উত্তরসমূহ ({Object.keys(selectedSubmission.answers || {}).length} / {questions.length} টি):</h3>
                <div className="answers-grid">
                  {questions.map((question) => {
                    const qid = question.id.toString()
                    const ans = (selectedSubmission.answers || {})[qid]
                    const isAnswered = ans !== undefined && ans !== null
                    const correct = isAnswered ? isAnswerCorrect(qid, ans) : null

                    return (
                      <div
                        key={qid}
                        className={`answer-item ${!isAnswered ? 'unanswered' :
                          correct === true ? 'correct-answer' :
                            correct === false ? 'incorrect-answer' : ''
                          }`}
                        onClick={() => handleQuestionClick(qid, ans)}
                        style={{ cursor: 'pointer' }}
                        title="ক্লিক করে বিস্তারিত দেখুন"
                      >
                        <span className="question-id bengali">প্রশ্ন {qid}</span>
                        <span className="answer-value">{isAnswered ? ans : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="question-detail-modal" onClick={() => setSelectedQuestion(null)}>
          <div className="question-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="question-modal-header">
              <h2 className="bengali">প্রশ্ন নং {selectedQuestion.id}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedQuestion(null)}
              >
                ✕
              </button>
            </div>
            <div className="question-modal-body">
              <div className="question-text bengali">
                <strong>প্রশ্ন:</strong>
                <p dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.question) }} />
              </div>

              <div className="options-list">
                <div className="option-item bengali">
                  <strong>A)</strong> <span dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.options.a) }} />
                </div>
                <div className="option-item bengali">
                  <strong>B)</strong> <span dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.options.b) }} />
                </div>
                <div className="option-item bengali">
                  <strong>C)</strong> <span dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.options.c) }} />
                </div>
                <div className="option-item bengali">
                  <strong>D)</strong> <span dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.options.d) }} />
                </div>
              </div>

              <div className="answer-details">
                {selectedQuestion.isAnswered ? (
                  <>
                    <div className={`student-answer ${selectedQuestion.isCorrect ? 'correct' : 'wrong'}`}>
                      <strong className="bengali">শিক্ষার্থীর উত্তর:</strong>
                      <span className="answer-badge">{selectedQuestion.studentAnswer}</span>
                      {selectedQuestion.isCorrect ? (
                        <span className="status-text correct bengali">✓ সঠিক</span>
                      ) : (
                        <span className="status-text wrong bengali">✗ ভুল</span>
                      )}
                    </div>
                    {!selectedQuestion.isCorrect && (
                      <div className="correct-answer-display">
                        <strong className="bengali">সঠিক উত্তর:</strong>
                        <span className="answer-badge correct">{selectedQuestion.correctAnswer}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-answer bengali">
                    <strong>শিক্ষার্থী এই প্রশ্নের উত্তর দেয়নি</strong>
                    <div className="correct-answer-display">
                      <strong className="bengali">সঠিক উত্তর:</strong>
                      <span className="answer-badge correct">{selectedQuestion.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Solution Section */}
              {selectedQuestion.solution && (
                <div className="solution-section">
                  <div className="solution-header bengali">
                    <span className="solution-icon">💡</span>
                    <strong>সমাধান/ব্যাখ্যা:</strong>
                  </div>
                  <div className="solution-content bengali" dangerouslySetInnerHTML={{ __html: renderLatex(selectedQuestion.solution) }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SubmissionsTable
