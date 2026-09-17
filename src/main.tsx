import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/providers/auth-provider'
import { ToastProvider } from '@/components/ui/toast'
import { QueryProvider } from '@/providers/query-provider'
import App from './App'
import './index.css'

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
