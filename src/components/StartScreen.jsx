import { useState } from 'react'
import './StartScreen.css'

function StartScreen({ onStart }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (name.trim()) {
      onStart(name.trim())
    }
  }

  return (
    <div className="start-screen">
      <div className="start-card">
        <h1 className="bengali">MCQ Exam</h1>
        <div className="exam-info">
          <p className="bengali">সময়: ১৮ মিনিট | মোট নম্বর: ৩১.২৫ | প্রশ্ন: ২৫</p>
          <p className="bengali">সঠিক: +১.২৫ | ভুল: -০.২৫ | পাস মার্ক: ১২.৫</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="student-name" className="bengali">নাম / আইডি</label>
          <input
            id="student-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম বা আইডি লিখুন"
            className="bengali"
            autoFocus
          />
          <button type="submit" className="primary-btn bengali">
            পরীক্ষা শুরু করুন
          </button>
          <p className="hint bengali">পাসওয়ার্ড প্রয়োজন নেই। শুধু নাম দিয়ে শুরু করুন।</p>
        </form>
      </div>
    </div>
  )
}

export default StartScreen


