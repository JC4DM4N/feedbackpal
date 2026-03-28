import { useState, useEffect } from 'react'
import './ReviewAppPage.css'
import './MyAppDetailPage.css'
import { AppPageHeader } from '../../components/AppPageHeader'
import { FeedbackRequestSection } from '../../components/FeedbackRequestSection'
import { FeedbackFeed } from '../../components/FeedbackFeed'

export default function MyAppDetailPage({ appId, onBack, onOpenReview }) {
  const [app, setApp] = useState(null)
  const [reviews, setReviews] = useState([])
  const [request, setRequest] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    Promise.all([
      fetch(`http://localhost:8000/apps/${appId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`http://localhost:8000/apps/${appId}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([appData, reviewsData]) => {
        setApp(appData)
        setRequest(appData.request)
        setReviews(reviewsData)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load app'); setLoading(false) })
  }, [appId])

  async function handleSaveRequest() {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ request }),
      })
      if (res.ok) {
        const updated = await res.json()
        setApp(updated)
        setRequest(updated.request)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="review-app-loading">Loading…</div>
  if (error) return <div className="review-app-loading">{error}</div>

  return (
    <div className="review-app-page">
      <AppPageHeader
        backLabel="← Back to my apps"
        onBack={onBack}
        color={app.color}
        initials={app.initials}
        name={app.name}
        stage={app.stage}
        url={app.url}
      />

      <div className="review-app-body">
        <div className="review-app-main">
          <FeedbackRequestSection
            value={request}
            originalValue={app.request}
            onChange={setRequest}
            onSave={handleSaveRequest}
            saving={saving}
          />

          <section className="review-section">
            <p className="review-section-label">YOUR FEEDBACK</p>
            <FeedbackFeed reviews={reviews} onOpenReview={onOpenReview} />
          </section>
        </div>
      </div>
    </div>
  )
}
