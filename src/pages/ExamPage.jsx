import { useState, useEffect } from 'react'
import MCQContainer from '../components/MCQContainer'
import StartScreen from '../components/StartScreen'
import ErrorBoundary from '../components/ErrorBoundary'
import { loadLatestQuestions } from '../utils/api'

function ExamPage() {
  const [studentName, setStudentName] = useState('')
  const [questions, setQuestions] = useState([])
  const [questionFile, setQuestionFile] = useState('questions.json')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    try {
      // Get the latest question file
      const { file } = await loadLatestQuestions()
      setQuestionFile(file)

      console.log(`Loading questions from /${file}`)
      const res = await fetch(`/${file}`, { cache: 'no-store' })
      console.log('Fetch response:', { status: res.status, ok: res.ok })

      if (!res.ok) {
        throw new Error(`Failed to load questions: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Loaded questions data:', { isArray: Array.isArray(data), count: data?.length })

      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No questions found in file')
      }

      // Transform questions to match expected format
      const transformed = data.map(q => ({
        id: q.id,
        question: q.question,
        options: Object.entries(q.options).map(([id, text]) => ({ id, text })),
        correctOptionId: q.correctAnswer,
        explanation: `সঠিক উত্তর: ${q.correctAnswer}. ${q.question}`,
        hasDiagram: q.hasDiagram || false,
        svg_code: q.svg_code || null,
        subject: q.subject || ''
      }))

      console.log('Transformed questions:', { count: transformed.length, firstQuestion: transformed[0] })

      // Validate transformed questions
      if (transformed.length === 0) {
        throw new Error('No valid questions found after processing')
      }

      setQuestions(transformed)
      setLoading(false)
    } catch (err) {
      console.error('Error loading questions:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>প্রশ্ন লোড হচ্ছে...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--error)', fontSize: '18px' }} className="bengali">
          প্রশ্ন লোড করতে সমস্যা হয়েছে
        </div>
        <div style={{ color: 'var(--gray-600)', fontSize: '14px', marginTop: '8px' }}>
          {error}
        </div>
        <button
          onClick={loadQuestions}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '16px'
          }}
          className="bengali"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    )
  }

  if (!studentName) {
    return <StartScreen onStart={(name) => {
      setStudentName(name)
    }} />
  }

  console.log('ExamPage rendering MCQContainer:', {
    studentName,
    questionsCount: questions.length,
    loading,
    error
  })

  return (
    <ErrorBoundary>
      <MCQContainer questions={questions} studentName={studentName} questionFile={questionFile} />
    </ErrorBoundary>
  )
}

export default ExamPage


