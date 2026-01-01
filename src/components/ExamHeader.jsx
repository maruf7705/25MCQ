import { useMemo } from 'react'
import './ExamHeader.css'

function ExamHeader({ examName, timeLeft, totalQuestions }) {
  const { minutes, seconds, colorClass } = useMemo(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    let colorClass = 'timer-green'

    if (timeLeft < 180) { // Less than 3 minutes
      colorClass = 'timer-red'
    } else if (timeLeft < 540) { // Less than 9 minutes
      colorClass = 'timer-yellow'
    }

    return {
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
      colorClass
    }
  }, [timeLeft])

  return (
    <header className="exam-header">
      <div className="exam-header-content">
        <h1 className="exam-title bengali">{examName}</h1>
        <div className={`timer ${colorClass} bengali`}>
          {minutes}:{seconds}
        </div>
      </div>
    </header>
  )
}

export default ExamHeader


