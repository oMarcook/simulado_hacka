import { useEffect, useRef, useState } from 'react'
import AlertaSaldo from '../components/AlertaSaldo.jsx'
import { api } from '../services/api.js'

const money = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })



export default function Pagamento({ data, onPaid }) {
  const balance = data.balance
  const creditLimit = data.creditLimit
  const [review, setReview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [value, setValue] = useState('747')
  const [recipient, setRecipient] = useState('Maria Silva')
  const [method, setMethod] = useState('account')
  const [stage, setStage] = useState('edit')
  const heading = useRef(null)
  const amount = Math.round(Number(value) * 100) / 100
  const valid = /^\d+(\.\d{0,2})?$/.test(value) && Number.isFinite(amount) && amount > 0
  const limit = method === 'account' ? balance : creditLimit
  const exceedsLimit = valid && amount > limit
  const canReview = valid && !exceedsLimit && recipient.trim().length > 0

  useEffect(() => { heading.current?.focus() }, [stage])
  async function reviewPayment(event) {
    event.preventDefault()
    if (!canReview || busy) return
    setBusy(true); setError('')
    try { const result = await api.review({ amount, recipient, method }); setReview(result); setStage('review') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function confirmPayment() {
    if (busy) return
    setBusy(true); setError('')
    try { const result = await api.confirm(review.reviewId); onPaid(result.summary); setStage('success') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  if (stage === 'success') return (
    <div className="bank-app payment-page">
      <main className="payment-content payment-success">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h1 tabIndex="-1" ref={heading}>Pagamento simulado!</h1>
        <p>{money(amount)} para {recipient.trim()}</p>
        <p className="summary-explanation">{method === 'account' ? 'Com saldo da conta' : 'Com cartão de crédito'}. Nenhuma cobrança real foi realizada. A operação foi salva no banco de demonstração; saldo, limite e histórico foram atualizados conforme a forma de pagamento.</p>
        <a className="primary-action" href="#inicio">Voltar ao início</a>
        <button className="secondary-action" disabled={busy} onClick={() => { setError(''); setStage('edit') }}>Simular outro pagamento</button>
      </main>
    </div>
  )

  return (
    <div className="bank-app payment-page">
      <header className="summary-header">
        <a className="back-link" href="#inicio">← Voltar ao início</a>
        <h1 tabIndex="-1" ref={heading}>{stage === 'edit' ? 'Fazer pagamento' : 'Revisar pagamento'}</h1>
        <p>Confira o impacto antes de confirmar.</p>
      </header>
      <main className="payment-content">{error && <p className="payment-validation" role="alert">{error}</p>}
        {stage === 'edit' ? <form onSubmit={reviewPayment}>
          <section className="payment-box payment-form">
            <label htmlFor="payment-recipient">Para quem você vai pagar?</label>
            <input id="payment-recipient" disabled={busy} value={recipient} onChange={(event) => setRecipient(event.target.value)} required maxLength="80" autoComplete="off" />
            <label htmlFor="payment-amount">Valor do pagamento (R$)</label>
            <input id="payment-amount" disabled={busy} type="number" inputMode="decimal" min="0.01" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required aria-describedby="payment-validation" aria-invalid={!valid || exceedsLimit} />
          </section>
          <fieldset className="payment-box payment-methods">
            <legend>Como deseja pagar?</legend>
            <label className={`payment-method ${method === 'account' ? 'selected' : ''}`}><input type="radio" disabled={busy} name="method" value="account" checked={method === 'account'} onChange={() => setMethod('account')} /><span>Pagar com saldo da conta<small>Saldo {money(balance)}</small></span></label>
            <label className={`payment-method ${method === 'credit' ? 'selected' : ''}`}><input type="radio" disabled={busy} name="method" value="credit" checked={method === 'credit'} onChange={() => setMethod('credit')} /><span>Pagar com cartão de crédito<small>Limite {money(creditLimit)}</small></span></label>
          </fieldset>
          <p className="payment-validation" id="payment-validation" aria-live="polite">{!valid ? 'Informe um valor maior que zero, com até duas casas decimais.' : exceedsLimit ? (method === 'account' ? 'Saldo insuficiente para esse pagamento.' : 'O valor ultrapassa o limite disponível do cartão.') : 'Na próxima etapa, você verá o impacto deste pagamento.'}</p>
          <button className="primary-action" type="submit" disabled={!canReview || busy}>{busy ? 'Consultando…' : 'Revisar pagamento →'}</button>
        </form> : <>
          <section className="payment-box payment-review">
            <h2>Confirmar pagamento<br />de {money(amount)}</h2>
            <p>Para <strong>{recipient.trim()}</strong></p>
            <span>{method === 'account' ? 'Pagar com saldo da conta' : 'Pagar com cartão de crédito'}</span>
          </section>
          <AlertaSaldo review={review} />
          <div className="payment-actions">
            <button className="primary-action" disabled={busy} onClick={confirmPayment}>{busy ? 'Confirmando…' : 'Confirmar pagamento simulado'}</button>
            <button className="secondary-action" disabled={busy} onClick={() => { setError(''); setStage('edit') }}>Voltar e ajustar</button>
          </div>
        </>}
        <p className="demo-note">Demonstração • nenhum pagamento real será realizado</p>
      </main>
    </div>
  )
}