import React from 'react'
import ReactDOM from 'react-dom/client'
import { Agentation } from 'agentation'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      {import.meta.env.DEV && <Agentation />}
    </ErrorBoundary>
  </React.StrictMode>,
)
