const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function AlertaSaldo({ review }) {
  const { amount, method, balance, bills, savings, remainingBalance, remainingCredit, tight } = review
  return <section className={`payment-warning ${tight ? 'payment-warning-tight' : ''}`} aria-labelledby="payment-warning-title">
    <div className="warning-heading"><span className="warning-symbol" aria-hidden="true">{tight ? '!' : '✓'}</span><span><span className="section-kicker">UMA PAUSA PARA PLANEJAR</span><h2 id="payment-warning-title">{tight ? 'Pode apertar no fim do mês' : 'Seu plano continua em dia'}</h2></span></div>
    <div className="warning-balance"><p>{method === 'account' ? 'Seu saldo após pagar' : 'Limite após esta compra'}</p><strong>{money(method === 'account' ? remainingBalance : remainingCredit)}</strong></div>
    <dl className="warning-comparison"><div><dt>{method === 'account' ? 'Saldo agora' : 'Saldo da conta (não muda)'}</dt><dd>{money(balance)}</dd></div><div><dt>{method === 'account' ? 'Este pagamento' : 'Valor adicionado à fatura'}</dt><dd>{method === 'account' ? '− ' : '+ '}{money(amount)}</dd></div></dl>
    <p className="payment-warning-detail">{method === 'account' ? <>Você tem <strong>{money(bills)}</strong> em contas e fatura e uma meta de <strong>{money(savings)}</strong> para guardar. {tight ? 'Esse pagamento comprometeria parte dessas reservas.' : 'Essas reservas estão preservadas neste cenário.'}</> : <>O pagamento será feito na fatura. {tight ? 'Essa nova despesa ultrapassa o valor disponível no seu planejamento atual.' : 'Reserve o valor da compra para o vencimento.'}</>}</p>
    <a href="#resumo" className="warning-summary-link">Rever meu planejamento <span aria-hidden="true">↗</span></a>
  </section>
}