import Icon from './Icon.jsx'
export default function BottomNav({ active }) {
  return <nav className="bottom-nav" aria-label="Navegação principal">
    {[['home', 'Início', '#inicio'], ['investments', 'Simulador', '#resumo'], ['card', 'Pagar', '#pagamento']].map(([icon, label, href]) => <a key={href} href={href} className={`nav-item ${active === href ? 'active' : ''}`} aria-current={active === href ? 'page' : undefined}><Icon name={icon} size={22} /><span>{label}</span></a>)}
  </nav>
}