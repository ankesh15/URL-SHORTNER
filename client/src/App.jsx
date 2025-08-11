import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function App() {
  const [longUrl, setLongUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminUrls, setAdminUrls] = useState([])
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')
    if (!longUrl) return

 
    try {
     
      new URL(longUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post(`${API_BASE}/api/shorten`, { url: longUrl })
      setShortUrl(res.data.shortUrl)
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">URL Shortener</h1>
        <p className="subtitle">Paste a long link and get a short, shareable URL.</p>
      </div>

      <div className="stack">
        <div className="card">
          <form onSubmit={handleSubmit} className="form">
            <input
              className="input"
              type="url"
              placeholder="Enter a long URL (https://...)"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
            />
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </form>
          {error && <div className="error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>

        {shortUrl && (
          <div className="result-card">
            <div className="short-url">
              <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
            </div>
            <div className="row">
              <button
                className="btn"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shortUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  } catch (_) { /* ignore */ }
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a className="btn" href={shortUrl} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
        )}

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>Admin</h2>
              <p className="hint" style={{ margin: '0.25rem 0 0 0' }}>List of shortened URLs and click counts</p>
            </div>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                setAdminLoading(true)
                setError('')
                try {
                  const res = await axios.get(`${API_BASE}/api/admin/urls`)
                  setAdminUrls(res.data)
                } catch (err) {
                  setError(err?.response?.data?.error || 'Failed to load admin list')
                } finally {
                  setAdminLoading(false)
                }
              }}
              disabled={adminLoading}
            >
              {adminLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {adminUrls?.length > 0 && (
            <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Short URL</th>
                    <th>Original URL</th>
                    <th>Clicks</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUrls.map((u) => (
                    <tr key={u.id}>
                      <td><a href={u.shortUrl} target="_blank" rel="noreferrer">{u.shortUrl}</a></td>
                      <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.originalUrl}</td>
                      <td>{u.clicks}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="footer">
          MADE BY APS
        </div>
      </div>
    </div>
  )
}

export default App
