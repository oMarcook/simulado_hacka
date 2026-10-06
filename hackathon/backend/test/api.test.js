import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStore } from '../src/store.js'
import { createApi } from '../src/server.js'
const payment = (amount = 747, method = 'account') => ({ amount, method, recipient: 'Maria' })
function setup(t) { const store = createStore(':memory:'); t.after(() => store.close()); return store }

test('seed and simulation preserve balance and history', t => {
  const store = setup(t)
  assert.match(store.summary().month, /^\d{4}-\d{2}$/)
  assert.equal(store.summary().balance, 800)
  assert.equal(store.summary().spent, 1200)
  assert.equal(store.summary().available, 400)
  assert.equal(store.simulate(747).remaining, -347)
  assert.match(store.summary().month, /^\d{4}-\d{2}$/)
  assert.equal(store.summary().balance, 800)
  assert.equal(store.transactions().length, 3)
})
test('review calculates warning; confirmation debits exactly once', t => {
  const store = setup(t)
  const review = store.review(payment())
  assert.equal(review.remainingBalance, 53)
  assert.equal(review.tight, true)
  assert.match(store.summary().month, /^\d{4}-\d{2}$/)
  assert.equal(store.summary().balance, 800)
  const first = store.confirm(review.reviewId)
  assert.equal(first.summary.balance, 53)
  assert.equal(first.summary.spent, 1947)
  assert.equal(first.summary.categories.find(item => item.category === 'Outros').amount, 747)
  assert.equal(store.confirm(review.reviewId).paymentId, first.paymentId)
  assert.equal(store.summary().balance, 53)
  assert.equal(store.transactions().length, 4)
})
test('stale review is rejected without partial writes', t => {
  const store = setup(t)
  const old = store.review(payment())
  store.confirm(store.review(payment(100)).reviewId)
  assert.throws(() => store.confirm(old.reviewId), /mudaram/)
  assert.equal(store.summary().balance, 700)
  assert.equal(store.transactions().length, 4)
})
test('credit uses limit and reserves invoice without debiting account', t => {
  const store = setup(t)
  store.confirm(store.review(payment(100, 'credit')).reviewId)
  assert.match(store.summary().month, /^\d{4}-\d{2}$/)
  assert.equal(store.summary().balance, 800)
  assert.equal(store.summary().creditLimit, 2000)
  assert.equal(store.summary().creditUsed, 100)
  assert.equal(store.summary().bills, 400)
  assert.equal(store.summary().available, 300)
})
test('validates amounts, method, recipient and limits', t => {
  const store = setup(t)
  for (const amount of [-1, 0, 1.001, NaN, Infinity, '10', null, 1000001]) assert.throws(() => store.review(payment(amount)))
  assert.throws(() => store.review(payment(801)), /Saldo/)
  assert.throws(() => store.review(payment(2101, 'credit')), /Limite/)
  assert.throws(() => store.review(payment(1, 'invalid')), /Forma/)
  assert.throws(() => store.review({ ...payment(), recipient: ' ' }), /destinatário/)
  assert.throws(() => store.confirm('missing'), /Revise/)
  assert.match(store.summary().month, /^\d{4}-\d{2}$/)
  assert.equal(store.summary().balance, 800)
})
test('cent amounts do not accumulate rounding errors', t => {
  const store = setup(t)
  for (let i = 0; i < 3; i++) store.confirm(store.review(payment(0.1)).reviewId)
  assert.equal(store.summary().balance, 799.7)
})
test('database persists payments after reopening', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hackathon-test-'))
  let store
  try {
    const filename = join(dir, 'test.sqlite')
    store = createStore(filename)
    const review = store.review(payment())
    store.confirm(review.reviewId)
    store.close(); store = createStore(filename)
    assert.equal(store.summary().balance, 53)
    assert.equal(store.transactions().length, 4)
    store.confirm(review.reviewId)
    assert.equal(store.summary().balance, 53)
  } finally { store?.close(); rmSync(dir, { recursive: true, force: true }) }
})
test('HTTP endpoints, bad JSON, origin and idempotent confirmation', async t => {
  const store = createStore(':memory:')
  const server = createApi(store)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close() })
  const base = `http://127.0.0.1:${server.address().port}/api`
  const post = (path, body, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  assert.equal((await (await fetch(base + '/summary')).json()).balance, 800)
  assert.equal((await (await post('/simulations', { amount: 747 })).json()).remaining, -347)
  const review = await (await post('/payments/review', payment())).json()
  const responses = await Promise.all([post('/payments/confirm', { reviewId: review.reviewId }), post('/payments/confirm', { reviewId: review.reviewId })])
  const results = await Promise.all(responses.map(response => response.json()))
  assert.equal(results[0].paymentId, results[1].paymentId)
  assert.equal(store.summary().balance, 53)
  assert.equal((await post('/payments/review', payment(100), { Origin: 'https://example.com' })).status, 403)
  assert.equal((await fetch(base + '/payments/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400)
  assert.equal((await post('/payments/review', null)).status, 400)
  assert.equal((await fetch(base + '/missing')).status, 404)
})