import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export class ApiError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}
const monthNow = () => {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
  return `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`
}
const reais = cents => cents / 100
function cents(value, allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < (allowZero ? 0 : 0.01) || value > 1000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) throw new ApiError('Informe um valor válido com até duas casas decimais.')
  return Math.round(value * 100)
}

export function createStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), balance INTEGER NOT NULL CHECK(balance>=0), credit_limit INTEGER NOT NULL, credit_used INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS transactions(id TEXT PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), amount INTEGER NOT NULL CHECK(amount>0), category TEXT NOT NULL, recipient TEXT NOT NULL, method TEXT NOT NULL, month TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bills(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), name TEXT NOT NULL, amount INTEGER NOT NULL, month TEXT NOT NULL, paid INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), amount INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, amount INTEGER NOT NULL, recipient TEXT NOT NULL, method TEXT NOT NULL, version INTEGER NOT NULL, month TEXT NOT NULL, expires_at INTEGER NOT NULL, payment_id TEXT REFERENCES transactions(id));`)
  if (!db.prepare('SELECT id FROM users LIMIT 1').get()) {
    db.exec('BEGIN IMMEDIATE')
    try {
      db.prepare('INSERT INTO users VALUES(1,?)').run('Ana')
      db.exec('INSERT INTO accounts VALUES(1,1,80000,210000,0,0); INSERT INTO goals VALUES(1,1,10000);')
      db.prepare('INSERT INTO bills VALUES(1,1,?,?,?,0)').run('Contas do mês', 30000, monthNow())
      for (const [category, amount] of [['Alimentação', 60000], ['Transporte', 20000], ['Lazer', 40000]]) {
        db.prepare('INSERT INTO transactions VALUES(?,1,?,?,?,?,?,?)').run(randomUUID(), amount, category, 'Histórico demonstrativo', 'account', monthNow(), new Date().toISOString())
      }
      db.exec('COMMIT')
    } catch (error) { db.exec('ROLLBACK'); throw error }
  }
  function summary() {
    const account = db.prepare('SELECT * FROM accounts WHERE id=1').get()
    const month = monthNow()
    const categories = db.prepare('SELECT category, SUM(amount) AS amount FROM transactions WHERE account_id=1 AND month=? GROUP BY category ORDER BY category').all(month)
    const bills = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM bills WHERE account_id=1 AND month<=? AND paid=0').get(month).total
    const savings = db.prepare('SELECT amount FROM goals WHERE account_id=1').get().amount
    // Credit purchases already made remain a commitment until their invoice is settled.
    const commitments = bills + account.credit_used
    return { user: db.prepare('SELECT name FROM users WHERE id=1').get(), month, balance: reais(account.balance), bills: reais(commitments), savings: reais(savings), available: reais(account.balance - commitments - savings), creditLimit: reais(account.credit_limit - account.credit_used), creditUsed: reais(account.credit_used), spent: reais(categories.reduce((total, item) => total + item.amount, 0)), categories: categories.map(item => ({ ...item, amount: reais(item.amount) })), version: account.version }
  }
  function simulate(value) {
    const amount = cents(value, true)
    const data = summary()
    return { ...data, remaining: reais(Math.round(data.available * 100) - amount) }
  }
  function review(payload) {
    const amount = cents(payload.amount)
    const recipient = typeof payload.recipient === 'string' ? payload.recipient.trim() : ''
    if (!recipient || recipient.length > 80) throw new ApiError('Informe um destinatário de até 80 caracteres.')
    if (!['account', 'credit'].includes(payload.method)) throw new ApiError('Forma de pagamento inválida.')
    const data = summary()
    const limit = payload.method === 'account' ? data.balance : data.creditLimit
    if (amount > Math.round(limit * 100)) throw new ApiError(payload.method === 'account' ? 'Saldo insuficiente.' : 'Limite de crédito insuficiente.', 409)
    const id = randomUUID()
    db.prepare('INSERT INTO reviews VALUES(?,?,?,?,?,?,?,NULL)').run(id, amount, recipient, payload.method, data.version, data.month, Date.now() + 10 * 60 * 1000)
    return { reviewId: id, amount: reais(amount), recipient, method: payload.method, ...data, remainingBalance: payload.method === 'account' ? reais(Math.round(data.balance * 100) - amount) : data.balance, remainingCredit: payload.method === 'credit' ? reais(Math.round(data.creditLimit * 100) - amount) : data.creditLimit, tight: amount > Math.round(data.available * 100) }
  }
  function confirm(id) {
    if (typeof id !== 'string') throw new ApiError('Revisão inválida.')
    db.exec('BEGIN IMMEDIATE')
    try {
      const item = db.prepare('SELECT * FROM reviews WHERE id=?').get(id)
      if (!item) throw new ApiError('Revise o pagamento antes de confirmar.', 404)
      if (item.payment_id) { const result = { paymentId: item.payment_id, summary: summary() }; db.exec('COMMIT'); return result }
      const account = db.prepare('SELECT * FROM accounts WHERE id=1').get()
      if (item.expires_at < Date.now() || item.version !== account.version || item.month !== monthNow()) throw new ApiError('Os dados mudaram ou a revisão expirou. Revise o pagamento novamente.', 409)
      const limit = item.method === 'account' ? account.balance : account.credit_limit - account.credit_used
      if (item.amount > limit) throw new ApiError('Saldo ou limite insuficiente.', 409)
      const paymentId = randomUUID()
      db.prepare('INSERT INTO transactions VALUES(?,1,?,?,?,?,?,?)').run(paymentId, item.amount, 'Outros', item.recipient, item.method, monthNow(), new Date().toISOString())
      if (item.method === 'account') db.prepare('UPDATE accounts SET balance=balance-?, version=version+1 WHERE id=1').run(item.amount)
      else db.prepare('UPDATE accounts SET credit_used=credit_used+?, version=version+1 WHERE id=1').run(item.amount)
      db.prepare('UPDATE reviews SET payment_id=? WHERE id=?').run(paymentId, id)
      const result = { paymentId, summary: summary() }
      db.exec('COMMIT')
      return result
    } catch (error) { db.exec('ROLLBACK'); throw error }
  }
  return { summary, simulate, review, confirm, transactions: () => db.prepare('SELECT id, amount/100.0 AS amount, category, recipient, method, created_at AS createdAt FROM transactions WHERE account_id=1 ORDER BY created_at DESC').all(), close: () => db.close() }
}