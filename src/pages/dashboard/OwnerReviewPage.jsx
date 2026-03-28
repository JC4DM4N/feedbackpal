import { useState, useEffect } from 'react'
import './ReviewAppPage.css'
import './OwnerReviewPage.css'
import { STAGE_STYLES } from '../../constants'

export default function OwnerReviewPage({ appId, reviewId, onBack }) {
  const [detail, setDetail] = useState(null)
  const [expandedImg, setExpandedImg] = useState(null)
  const [modal, setModal] = useState(null) // 'approve' | 'request-changes' | 'reject'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`http://localhost:8000/apps/${appId}/reviews/${reviewId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setDetail(data); setLoading(false) })
      .catch(() => { setError('Failed to load review'); setLoading(false) })
  }, [appId, reviewId])

  async function handleAction(action, message) {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/apps/${appId}/reviews/${reviewId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ message }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.detail || 'Something went wrong')
    }
    const data = await res.json()
    setDetail(data)
    setModal(null)
  }

  if (loading) return <div className="review-app-loading">Loading…</div>
  if (error) return <div className="review-app-loading">{error}</div>

  const stage = STAGE_STYLES[detail.app_stage]
  const canAct = detail.is_submitted && !detail.is_complete && !detail.is_rejected

  return (
    <>
      {expandedImg && (
        <div className="img-lightbox" onClick={() => setExpandedImg(null)}>
          <img src={expandedImg} alt="Screenshot" className="img-lightbox-img" />
        </div>
      )}

      {modal && (
        <ActionModal
          action={modal}
          onConfirm={msg => handleAction(modal, msg)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="review-app-page">
        <div className="review-app-header">
          <button className="review-app-back" onClick={onBack}>← Back to app</button>
          <div className="review-app-title-row">
            <div className="review-app-icon" style={{ background: detail.app_color }}>
              {detail.app_initials}
            </div>
            <div className="review-app-title-block">
              <h1 className="review-app-name">{detail.app_name}</h1>
              <div className="review-app-meta">
                <span className="app-stage-badge" style={stage}>{detail.app_stage}</span>
                {detail.is_rejected  && <span className="review-status-badge rejected">Rejected</span>}
                {detail.is_complete  && <span className="review-status-badge complete">Approved</span>}
                {detail.is_submitted && !detail.is_complete && !detail.is_rejected && (
                  <span className="review-status-badge awaiting">Awaiting approval</span>
                )}
                {!detail.is_submitted && !detail.is_complete && !detail.is_rejected && (
                  <span className="review-status-badge in-progress">In progress</span>
                )}
              </div>
            </div>
            <a
              href={detail.app_url.startsWith('http') ? detail.app_url : `https://${detail.app_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="visit-app-btn"
            >
              Visit app ↗
            </a>
          </div>
        </div>

        <div className="review-app-body">
          <div className="review-app-main">
            <section className="review-section">
              <p className="review-section-label">DESCRIBE THE FEEDBACK YOU ARE LOOKING FOR</p>
              <textarea className="review-request-text" value={detail.app_request} readOnly />
            </section>

            {detail.owner_message && (
              <div className={`owner-message-banner${detail.is_rejected ? ' owner-message-banner--rejected' : detail.is_complete ? ' owner-message-banner--approved' : ''}`}>
                <span className="owner-message-label">
                  {detail.is_rejected ? 'You rejected this review' : detail.is_complete ? 'You approved this review' : 'You requested changes'}
                </span>
                <p className="owner-message-text">{detail.owner_message}</p>
              </div>
            )}

            <section className="review-section">
              <p className="review-section-label">REVIEWER'S FEEDBACK</p>
              <textarea
                className="review-feedback-input"
                value={detail.feedback || ''}
                readOnly
                disabled
                placeholder="No feedback written yet."
              />
            </section>

            {canAct && (
              <div className="review-app-actions">
                <button className="owner-reject-btn" onClick={() => setModal('reject')}>
                  Reject review
                </button>
                <div className="owner-right-actions">
                  <button className="owner-request-btn" onClick={() => setModal('request-changes')}>
                    Request changes
                  </button>
                  <button className="owner-approve-btn" onClick={() => setModal('approve')}>
                    Approve review →
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="review-app-sidebar">
            <section className="review-section">
              <p className="review-section-label">SCREENSHOTS</p>
              {detail.screenshots.length === 0 ? (
                <p className="review-screenshots-hint">No screenshots attached.</p>
              ) : (
                <div className="screenshots-grid">
                  {detail.screenshots.map((filename, i) => (
                    <img
                      key={i}
                      src={`http://localhost:8000/uploads/${filename}`}
                      alt={`Screenshot ${i + 1}`}
                      className="screenshot-thumb screenshot-thumb--clickable"
                      onClick={() => setExpandedImg(`http://localhost:8000/uploads/${filename}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}

const MODAL_CONFIG = {
  'approve': {
    title: 'Approve this review',
    placeholder: 'e.g. Thanks for the thorough feedback, really helpful!',
    confirmLabel: 'Approve review →',
    confirmClass: 'owner-approve-btn',
  },
  'request-changes': {
    title: 'Request changes',
    placeholder: 'e.g. Could you go into more detail about the onboarding flow?',
    confirmLabel: 'Send request',
    confirmClass: 'owner-request-btn',
  },
  'reject': {
    title: 'Reject this review',
    placeholder: 'e.g. This feedback doesn\'t address the areas I asked about.',
    confirmLabel: 'Reject review',
    confirmClass: 'owner-reject-btn',
  },
}

function ActionModal({ action, onConfirm, onClose }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const config = MODAL_CONFIG[action]

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(message.trim())
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <p className="modal-title">{config.title}</p>
        <textarea
          className="modal-action-input"
          placeholder={config.placeholder}
          value={message}
          onChange={e => setMessage(e.target.value)}
          autoFocus
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className={config.confirmClass}
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
          >
            {submitting ? 'Saving…' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
