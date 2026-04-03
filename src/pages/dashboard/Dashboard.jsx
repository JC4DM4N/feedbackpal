import { useState, useEffect } from 'react'
import './Dashboard.css'
import Sidebar from '../../components/Sidebar'
import ExplorePage from './ExplorePage'
import MyAppsPage from './MyAppsPage'
import MyAppDetailPage from './MyAppDetailPage'
import OwnerReviewPage from './OwnerReviewPage'
import ReviewsPage from './ReviewsPage'
import ReviewAppPage from './ReviewAppPage'
import CreditsPage from './CreditsPage'
import SubmitAppPage from './SubmitAppPage'
import NotificationsPage from './NotificationsPage'

const NAV = [
  { id: 'explore',  label: 'Explore' },
  { id: 'my-apps',  label: 'My Apps' },
  { id: 'reviews',  label: 'Reviews' },
  { id: 'credits',  label: 'Credits' },
]

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState('explore')
  const [reviewId, setReviewId] = useState(null)
  const [appId, setAppId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:8000/notifications/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setUnreadCount(data.filter(n => !n.is_read).length))
      .catch(() => {})
  }, [page])

  function handleOpenReview(id) {
    setReviewId(id)
    setPage('review-app')
  }

  function handleOpenApp(id) {
    setAppId(id)
    setPage('my-app-detail')
  }

  function handleOpenOwnerReview(id) {
    setReviewId(id)
    setPage('owner-review')
  }

  function handleNavChange(p) {
    setReviewId(null)
    setAppId(null)
    setPage(p)
  }

  return (
    <div className="dashboard">
      <Sidebar page={page} setPage={handleNavChange} user={user} onLogout={onLogout} unreadCount={unreadCount} />
      <main className="dash-main">
        {page === 'explore'       && <ExplorePage onOpenReview={handleOpenReview} onSubmitApp={() => setPage('submit-app')} />}
        {page === 'my-apps'       && <MyAppsPage onOpenApp={handleOpenApp} />}
        {page === 'my-app-detail' && <MyAppDetailPage appId={appId} onBack={() => handleNavChange('my-apps')} onOpenReview={handleOpenOwnerReview} />}
        {page === 'owner-review'  && <OwnerReviewPage appId={appId} reviewId={reviewId} onBack={() => setPage('my-app-detail')} />}
        {page === 'reviews'       && <ReviewsPage onOpenReview={handleOpenReview} />}
        {page === 'review-app'    && <ReviewAppPage reviewId={reviewId} onBack={() => handleNavChange('reviews')} />}
        {page === 'credits'        && <CreditsPage />}
        {page === 'submit-app'     && <SubmitAppPage onBack={() => setPage('explore')} onAppCreated={id => { setAppId(id); setPage('my-app-detail') }} />}
        {page === 'notifications'  && (
          <NotificationsPage
            onOpenReview={id => { setReviewId(id); setPage('review-app') }}
            onOpenOwnerReview={(reviewId, appId) => { setReviewId(reviewId); setAppId(appId); setPage('owner-review') }}
            onOpenApp={id => { setAppId(id); setPage('my-app-detail') }}
            onRead={() => setUnreadCount(c => Math.max(0, c - 1))}
          />
        )}
        {page !== 'explore' && page !== 'my-apps' && page !== 'my-app-detail' && page !== 'owner-review' && page !== 'reviews' && page !== 'review-app' && page !== 'credits' && page !== 'submit-app' && page !== 'notifications' && (
          <ComingSoon label={NAV.find(n => n.id === page)?.label} />
        )}
      </main>
    </div>
  )
}


function ComingSoon({ label }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-icon">🚧</div>
      <h2>{label}</h2>
      <p>This page is coming soon.</p>
    </div>
  )
}
