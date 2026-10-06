async function request(path, body, signal) {
  const response = await fetch(`/api${path}`, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal })
  const data = await response.json().catch(() => ({ error: 'Não foi possível acessar a API. Verifique se o backend está rodando.' }))
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.')
  return data
}
export const api = {
  summary: signal => request('/summary', undefined, signal),
  simulate: (amount, signal) => request('/simulations', { amount }, signal),
  review: payload => request('/payments/review', payload),
  confirm: reviewId => request('/payments/confirm', { reviewId }),
}