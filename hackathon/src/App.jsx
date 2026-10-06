import { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import Pagamento from './pages/Pagamento.jsx'
import ResumoFinanceiro from './pages/ResumoFinanceiro.jsx'
import { api } from './services/api.js'
import './App.css'

export default function App() {
  const [page, setPage] = useState(window.location.hash)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const updatePage = () => { setPage(window.location.hash); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    api.summary(controller.signal).then(result => { setData(result); setError('') }).catch(err => { if (err.name !== 'AbortError') setError(err.message) })
    return () => controller.abort()
  }, [attempt, page])
  if (error) return <main className="bank-app summary-content"><h1>Não foi possível carregar sua conta</h1><p role="alert">{error}</p><button className="primary-action" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Tentar novamente</button></main>
  if (!data) return <main className="bank-app summary-content"><p role="status">Carregando sua conta…</p></main>
  if (page === '#pagamento') return <Pagamento data={data} onPaid={setData} />
  return page === '#resumo' ? <ResumoFinanceiro data={data} /> : <Home data={data} />
}