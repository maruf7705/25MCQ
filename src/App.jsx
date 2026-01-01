import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Lazy load pages for code splitting
const ExamPage = lazy(() => import('./pages/ExamPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

// Loading fallback component
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: 'var(--gray-700)'
    }}>
      <div className="bengali">লোড হচ্ছে...</div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<ExamPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App


