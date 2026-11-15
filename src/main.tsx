import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyMotionPref } from './lib/motion'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Animações: aplica a escolha salva (sistema / sempre ligadas / reduzidas)
applyMotionPref()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// App instalável e com cache offline (só no site publicado; em desenvolvimento atrapalharia)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
