export default function Icon({ name, size = 24 }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3m0 3h.01" /></>,
    bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4M12 2v2" /></>,
    dollar: <><path d="M16 6H10a4 4 0 0 0 0 8h4a4 4 0 0 1 0 8H7M12 2v22" transform="translate(0 -1) scale(1 .92)" /></>,
    card: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M11 18h2" /></>,
    crypto: <><path d="M17 7a7 7 0 1 0 0 10M9 2v3m5-3v3M9 19v3m5-3v3M6 12h8" /></>,
    home: <><path d="m3 10 9-8 9 8v11h-6v-7H9v7H3Z" /></>,
    investments: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M7 17v-4m5 4V8m5 9v-6" /></>,
    account: <><circle cx="12" cy="12" r="10" /><path d="M15 7h-4a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5H9m3-12v14" /></>,
    products: <><path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z" /></>,
    market: <><path d="M5 2v5m0 9v6M12 2v10m0 7v3M19 2v3m0 9v8" /><path d="M3 7h4v9H3Zm7 5h4v7h-4Zm7-7h4v9h-4Z" /></>,
    chevron: <path d="m6 15 6-6 6 6" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

