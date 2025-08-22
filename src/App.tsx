import { useState } from 'react'

function App() {
  const [health, setHealth] = useState<string>('')
  const [echo, setEcho] = useState<string>('')

  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const callHealth = async () => {
    setHealth('Loading...')
    try {
      const res = await fetch(`${base}/health`)
      const text = await res.text()
      setHealth(text)
    } catch (e) {
      setHealth(String(e))
    }
  }

  const callEcho = async () => {
    setEcho('Loading...')
    try {
      const res = await fetch(`${base}/api/v1/echo?q=hello`)
      const json = await res.json()
      setEcho(JSON.stringify(json, null, 2))
    } catch (e) {
      setEcho(String(e))
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>KUS AWS Frontend (Vite + React + TS)</h1>
      <p>Base URL: <code>{base}</code></p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={callHealth}>API_BASE_URL /health 호출</button>
        <button onClick={callEcho}>API_BASE_URL /api/v1/echo 호출</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>/health 응답</h3>
        <pre>{health}</pre>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>/api/v1/echo 응답</h3>
        <pre>{echo}</pre>
      </div>
    </div>
  )
}

export default App
