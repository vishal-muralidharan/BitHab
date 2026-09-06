import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/style.css'
import './assets/css/themes.css'
import './assets/css/custom-dialogs.css'
import './assets/css/auth.css'
import './assets/css/dashboard.css'
import './assets/css/notes.css'
import './assets/css/focus.css'
import './assets/css/clock.css'
import './assets/css/deep-focus.css'
import './assets/css/lists.css'
import './assets/css/management.css'
import './assets/css/schedule.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
