import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import { ExercisesProvider } from './lib/exercises'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ExercisesProvider>
          <App />
        </ExercisesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
