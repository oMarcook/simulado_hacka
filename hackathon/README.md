# MVP de planejamento financeiro

Aplicação React + API Node.js + SQLite, para demonstração local de um hackathon.

## Executar

Requer Node.js 22.18 ou superior (o SQLite nativo é experimental no Node 22).

```sh
npm install
npm run dev:all
```

Abra o endereço informado pelo Vite, normalmente http://127.0.0.1:5173.
O comando inicia frontend e backend; Ctrl+C encerra ambos.
Também é possível executar `npm run dev` e `npm run dev:api` em dois terminais.
Para verificar: `npm test`, `npm run lint` e `npm run build`.
`npm run preview` também requer o backend ligado em outro terminal.

## Dados e regras

O banco é criado automaticamente em `backend/data/demo.sqlite` na primeira execução e não entra no Git. Reiniciar preserva os dados; não é preciso configurar senhas ou instalar um servidor de banco. A variável DB_PATH permite escolher outro arquivo SQLite.

A conta local de Ana começa com saldo de R$ 800, histórico de gastos de R$ 1.200, contas previstas de R$ 300 e meta de R$ 100. O limite disponível inicial é R$ 2.100, sem fatura de crédito inicial. O histórico inicial já está refletido no saldo: não é descontado novamente.

Tabelas: users, accounts, transactions, bills, goals e reviews. Valores são guardados em centavos inteiros. O mês é calculado no fuso America/Sao_Paulo; o histórico é filtrado por mês, e contas anteriores não pagas continuam comprometendo o saldo. A meta é mensal e a fatura acumulada permanece comprometida até liquidação (fluxo de liquidação não incluído).

- Simular ou revisar não movimenta saldo.
- Confirmar registra uma transação simulada persistente. Na conta, debita saldo; no crédito, consome limite e aumenta o valor comprometido com a fatura.
- A confirmação usa uma transação SQLite para atualizar saldo/limite e histórico juntos.
- Repetir o mesmo ID de revisão devolve a mesma operação sem duplicá-la.
- Revisões expiram em 10 minutos; mudança da conta ou do mês exige nova revisão.
- Home e resumo mostram dados atualizados após o pagamento.

## API

| Método | Rota | Uso |
|---|---|---|
| GET | /api/summary | Saldo, gastos mensais, categorias, contas, meta e limite |
| GET | /api/transactions | Histórico completo |
| POST | /api/simulations | Corpo: `{ "amount": 150 }` |
| POST | /api/payments/review | Corpo: `{ "amount": 747, "recipient": "Maria", "method": "account" }`; method também aceita `credit` |
| POST | /api/payments/confirm | Corpo: `{ "reviewId": "ID recebido na revisão" }` |

Vite encaminha `/api` para a API em 127.0.0.1:3001. Erros usam JSON com campo `error` e status HTTP adequado.

## Escopo

É um protótipo local de uma única conta, sem autenticação, integração bancária ou pagamentos reais. Não publicar a API como serviço financeiro: login, isolamento entre usuários e integração com um provedor de pagamentos são etapas separadas. O servidor escuta apenas no loopback. Cadastro/edição de contas previstas, metas e liquidação da fatura ainda não têm telas; são dados de demonstração do banco.

Os testes usam bancos isolados temporários ou em memória e nunca alteram o banco da demonstração.