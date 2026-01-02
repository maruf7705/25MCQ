import { useState, useEffect } from 'react'
import { loadQuestionFiles, getActiveQuestionFile, setActiveQuestionFile } from '../../utils/api'
import './QuestionSetModal.css'

function QuestionSetModal({ isOpen, onClose, onSave }) {
    const [questionFiles, setQuestionFiles] = useState([])
    const [activeFile, setActiveFile] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen])

    async function loadData() {
        try {
            setLoading(true)
            setError(null)

            const [files, activeConfig] = await Promise.all([
                loadQuestionFiles(),
                getActiveQuestionFile()
            ])

            setQuestionFiles(files)
            setActiveFile(activeConfig.activeFile)
            setSelectedFile(activeConfig.activeFile)
        } catch (err) {
            console.error('Failed to load question files:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!selectedFile) {
            setError('অনুগ্রহ করে একটি প্রশ্ন সেট নির্বাচন করুন')
            return
        }

        try {
            setSaving(true)
            setError(null)

            await setActiveQuestionFile(selectedFile)

            // Call parent callback
            if (onSave) {
                onSave(selectedFile)
            }

            // Close modal after short delay
            setTimeout(() => {
                onClose()
            }, 500)
        } catch (err) {
            console.error('Failed to save selection:', err)
            setError(err.message)
            setSaving(false)
        }
    }

    function handleCardClick(fileName) {
        setSelectedFile(fileName)
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            onClose()
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    function formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="bengali">প্রশ্ন সেট সেটিংস</h2>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p className="bengali">লোড হচ্ছে...</p>
                        </div>
                    ) : questionFiles.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3 className="bengali">কোন প্রশ্ন সেট পাওয়া যায়নি</h3>
                            <p>public folder এ question JSON file যোগ করুন</p>
                        </div>
                    ) : (
                        <div className="question-sets-grid">
                            {questionFiles.map((file) => {
                                const isActive = file.name === activeFile
                                const isSelected = file.name === selectedFile

                                return (
                                    <div
                                        key={file.name}
                                        className={`question-set-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleCardClick(file.name)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleCardClick(file.name)
                                            }
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="questionSet"
                                            value={file.name}
                                            checked={isSelected}
                                            onChange={() => handleCardClick(file.name)}
                                            aria-label={file.displayName}
                                        />
                                        <div className="card-content">
                                            <div className="card-icon">📄</div>
                                            <div className="card-details">
                                                <h3 className="card-title">{file.displayName}</h3>
                                                <div className="card-meta">
                                                    <span className="file-size">{formatFileSize(file.size)}</span>
                                                    <span className="file-date">{formatDate(file.lastModified)}</span>
                                                </div>
                                            </div>
                                            {isActive && (
                                                <span className="active-badge bengali">সক্রিয়</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="cancel-button bengali"
                        onClick={onClose}
                        disabled={saving}
                    >
                        বাতিল
                    </button>
                    <button
                        className="save-button bengali"
                        onClick={handleSave}
                        disabled={loading || saving || !selectedFile}
                    >
                        {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default QuestionSetModal
