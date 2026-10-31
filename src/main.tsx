import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// The judges page is its own chunk. Nothing in it (including the ambient
// three.js scene) is downloaded on the product routes.
const JudgesPage = lazy(() => import('./judges/JudgesPage.tsx'))

const path = window.location.pathname.replace(/\/+$/, '')
const isJudges = path === '/judges'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isJudges ? (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-primary text-sm text-secondary">
            Loading the record
          </div>
        }
      >
        <JudgesPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
)
