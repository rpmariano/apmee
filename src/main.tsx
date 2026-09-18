import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/providers/auth-provider'
import { ToastProvider } from '@/components/ui/toast'
import { QueryProvider } from '@/providers/query-provider'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Automatic PWA Service Worker update:
// Polls for new deployments every 60s and on tab visibility/focus.
// When a new build is deployed, skipWaiting + clientsClaim forces instant activation,
// and controllerchange reloads the page to the new version seamlessly.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update()
      }, 60 * 1000)

      // Check for updates when user returns to the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update()
        }
      })
      window.addEventListener('focus', () => {
        registration.update()
      })
    }
  },
})

if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

// SPA redirect handler for GitHub Pages 404.html hack
// Picks up the redirect query param and replaces the URL
;(function () {
  const redirect = sessionStorage.redirect
  delete sessionStorage.redirect
  if (redirect && redirect !== location.href) {
    history.replaceState(null, '', redirect)
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
)
