import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import BottomNav from '../components/BottomNav.jsx'
export default function Home({ data }) {
  const [showSpendingAlert, setShowSpendingAlert] = useState(true)
  const [showValues, setShowValues] = useState(false)
  const [notice, setNotice] = useState('')
  const money = value => showValues ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <span className="hidden-money" aria-label="Valor oculto">••••••</span>
  const month = new Date(`${data.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' })
  return <div className="bank-app redesigned-home">
    <header className="app-header">
      <div className="profile-button"><span className="avatar">{data.user.name.slice(0, 1)}</span><span className="profile-copy"><span>Bom ter você aqui</span><strong>Olá, {data.user.name}</strong></span></div>
      <button className="icon-button" aria-label="Notificações" onClick={() => setNotice('Tudo em dia. Nenhuma nova notificação.')}><Icon name="bell" /></button>
    </header>
    <main className="home-content">
      <section className="balance-hero" aria-labelledby="account-title">
        <div className="hero-top"><h1 id="account-title">Saldo da conta</h1><button className="icon-button" aria-label={showValues ? 'Ocultar valores' : 'Mostrar valores'} aria-pressed={showValues} onClick={() => setShowValues(!showValues)}><Icon name="eye" size={21} /></button></div>
        <p className="hero-amount">{money(data.balance)}</p>
        <div className="hero-footer"><span><i className="status-dot" />Conta Digital</span><span>Visão de {month}</span></div>
      </section>
      <div className="quick-actions">
        <a href="#pagamento"><span className="action-icon"><Icon name="arrow" /></span><strong>Fazer pagamento</strong></a>
        <a href="#resumo"><span className="action-icon"><Icon name="investments" /></span><strong>Simular gastos</strong></a>
      </div>
      {showSpendingAlert && <section className="spending-invitation" aria-labelledby="spending-invitation-title">
        <button className="close-invitation" aria-label="Fechar convite para o simulador de gastos" onClick={() => setShowSpendingAlert(false)}>×</button>
        <span className="section-kicker">UM PASSO À FRENTE</span>
        <h2 id="spending-invitation-title">Seu próximo gasto<br />cabe no mês?</h2>
        <p>Veja o que já gastou e planeje o que vem pela frente.</p>
        <a href="#resumo">Entrar no simulador <Icon name="arrow" size={18} /></a>
        <div className="invitation-art" aria-hidden="true"><span /><span /><span /><span /></div>
      </section>}
      <div className="section-heading"><h2>Seu mês, de perto</h2><a href="#resumo">Ver resumo <span aria-hidden="true">↗</span></a></div>
      <div className="overview-grid">
        <section className="overview-card"><span className="mini-icon gold"><Icon name="account" size={20} /></span><p>{data.available < 0 ? 'Falta para cobrir o plano' : 'Disponível para gastar'}</p><strong>{money(Math.abs(data.available))}</strong><small>Após contas e meta</small></section>
        <section className="overview-card"><span className="mini-icon mint"><Icon name="products" size={20} /></span><p>Meta para guardar</p><strong>{money(data.savings)}</strong><small>Seu plano do mês</small></section>
      </div>
      <section className="finance-card compact-account"><div className="section-heading"><h2>Cartão de crédito</h2><Icon name="card" size={21} /></div><div className="balance-row"><div><p className="label">Fatura acumulada</p><p className="amount">{money(data.creditUsed)}</p></div><div className="right-balance"><p className="label">Limite disponível</p><p className="amount">{money(data.creditLimit)}</p></div></div></section>
      <p className="demo-note">Ambiente de demonstração · sem dinheiro real</p>
    </main>
    <BottomNav active="#inicio" />
    {notice && <div className="notice" role="status"><p>{notice}</p><button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}
  </div>
}