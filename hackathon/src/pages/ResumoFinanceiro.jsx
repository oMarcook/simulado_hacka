import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { api } from '../services/api.js'

const currency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ResumoFinanceiro({ data }) {
  const [expense, setExpense] = useState('')
  const balance = data.balance
  const bills = data.bills
  const savings = data.savings
  const parsedExpense = Number(expense)
  const validExpense = expense === '' || (Number.isFinite(parsedExpense) && parsedExpense >= 0 && /^\d+(\.\d{0,2})?$/.test(expense))
  const plannedExpense = validExpense ? Math.round(parsedExpense * 100) / 100 : 0
  const available = data.available
  const [simulation, setSimulation] = useState(null)
  const [simulationError, setSimulationError] = useState(null)
  const [retry, setRetry] = useState(0)
  const simulationKey = `${expense}:${data.version}:${data.month}`
  const remaining = expense === '' ? available : simulation?.key === simulationKey ? simulation.remaining : null
  const currentError = simulationError?.key === simulationKey ? simulationError.message : ''
  useEffect(() => {
    if (!validExpense || expense === '') return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api.simulate(plannedExpense, controller.signal).then(result => { setSimulation({ key: simulationKey, remaining: result.remaining }); setSimulationError(null) }).catch(error => { if (error.name !== 'AbortError') setSimulationError({ key: simulationKey, message: error.message }) })
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [expense, plannedExpense, validExpense, simulationKey, retry])
  const month = new Date(`${data.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const categoryColors = ['#e8ca77', '#8cc8b3', '#aa9acc', '#91b2d8']
  return (
    <div className="bank-app summary-page">
      <header className="summary-header">
        <a className="back-link" href="#inicio">← Voltar ao início</a>
        <span className="section-kicker">SEU DINHEIRO, COM CLAREZA</span>
        <h1>Planeje seu mês.</h1>
        <p>Uma decisão agora. Mais tranquilidade depois.</p>
      </header>
      <main className="summary-content">
        <section className="budget-overview" aria-labelledby="month-title">
          <div className="hero-top"><h2 id="month-title">{available < 0 ? 'Falta para cobrir seu plano' : 'Disponível para gastar'}</h2><span className="month-pill">{month}</span></div>
          <strong className={`budget-amount ${available < 0 ? 'negative' : ''}`}>{currency(Math.abs(available))}</strong>
          <p className="summary-explanation">{available < 0 ? 'Seu saldo não cobre todas as contas e a meta previstas.' : 'O que sobra depois de reservar suas contas e sua meta.'}</p>
          <dl className="budget-breakdown"><div><dt>Saldo atual</dt><dd>{currency(balance)}</dd></div><div><dt>Contas e fatura</dt><dd>− {currency(bills)}</dd></div><div><dt>Meta para guardar</dt><dd>− {currency(savings)}</dd></div></dl>
        </section>
        <section className="finance-card simulation-panel" aria-labelledby="simulation-title">
          <div className="section-heading"><h2 id="simulation-title">E se eu gastar…</h2><span className="subtle-pill">Simulação</span></div>
          <p className="summary-explanation">Experimente um valor antes de decidir.</p>
          <label htmlFor="planned-expense">Valor do próximo gasto</label>
          <div className="currency-input"><span aria-hidden="true">R$</span><input id="planned-expense" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={expense} onChange={event => setExpense(event.target.value)} aria-invalid={!validExpense} aria-describedby={!validExpense ? 'expense-error' : 'simulation-result'} /></div>
          <div className="amount-presets" aria-label="Valores sugeridos">{[50, 150, 300, 747].map(value => <button key={value} aria-pressed={expense === String(value)} onClick={() => setExpense(String(value))}>{currency(value)}</button>)}</div>
          {!validExpense && <p className="simulation-warning" id="expense-error">Informe um valor positivo ou zero, com até duas casas decimais.</p>}
          <div id="simulation-result" className={`simulation-result ${remaining < 0 ? 'over-budget' : ''}`} aria-live="polite">
            {validExpense && remaining !== null && !currentError && <>
              <span className="result-status">{remaining < 0 ? '⚠ Compromete suas reservas' : '✓ Dentro do seu planejamento'}</span>
              <div className="before-after"><div><p>{available < 0 ? 'Falta hoje' : 'Disponível hoje'}</p><strong>{currency(Math.abs(available))}</strong></div><span aria-hidden="true">→</span><div><p>{remaining < 0 ? 'Faltaria' : 'Após o gasto'}</p><strong>{currency(Math.abs(remaining))}</strong></div></div>
              <p className="result-explanation">{remaining < 0 && plannedExpense === 0 ? 'Seu planejamento já está acima do saldo atual. Revise suas contas e sua meta antes de um novo gasto.' : remaining < 0 ? 'Esse valor usaria parte do dinheiro previsto para suas contas ou para guardar. Experimente um gasto menor.' : 'Suas contas e sua meta continuam reservadas neste cenário.'}</p>
            </>}
          </div>
          {validExpense && remaining === null && !currentError && <p className="summary-explanation" role="status">Calculando seu cenário…</p>}
          {currentError && <div role="alert"><p>{currentError}</p><button onClick={() => { setSimulationError(null); setRetry(retry + 1) }}>Tentar novamente</button></div>}
          {expense !== '' && <button className="reset-simulation" onClick={() => setExpense('')}>Limpar simulação</button>}
          <p className="simulation-footnote">Apenas uma previsão. Seu saldo não será alterado.</p>
        </section>
        <section className="finance-card category-panel" aria-labelledby="categories-title">
          <div className="section-heading"><h2 id="categories-title">Para onde foi seu dinheiro</h2></div><p className="category-total">{currency(data.spent)} <span>gastos neste mês</span></p>
          <div className="category-strip" aria-hidden="true">{data.categories.map((item, index) => <span key={item.category} style={{ flex: item.amount, background: categoryColors[index % categoryColors.length] }} />)}</div>
          <dl className="category-list">{data.categories.map((item, index) => <div key={item.category}><dt><i style={{ background: categoryColors[index % categoryColors.length] }} />{item.category}</dt><dd><strong>{currency(item.amount)}</strong><span>{data.spent ? Math.round(item.amount / data.spent * 100) : 0}%</span></dd></div>)}</dl>
          {data.categories.length === 0 && <p className="summary-explanation">Nenhum gasto registrado neste mês.</p>}
        </section>
        <p className="demo-note">Ambiente de demonstração · valores do seu banco local</p>
      </main>
      <BottomNav active="#resumo" />
    </div>
  )
}