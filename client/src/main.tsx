import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary for dynamic imports
window.addEventListener('error', (event) => {
  if (event.error && event.error.message.includes('Failed to fetch dynamically imported module')) {
    console.error('Dynamic import failed, attempting page reload:', event.error);
    // Try to reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message.includes('Failed to fetch dynamically imported module')) {
    console.error('Unhandled dynamic import rejection:', event.reason);
    event.preventDefault();
    // Try to reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
