<<<<<<< HEAD
# API Documentation - Tasca do Vereda

## Visão Geral

A API de integração do Tasca do Vereda permite que aplicações terceiras acessem e gerenciem dados do seu restaurante em tempo real, incluindo pedidos, clientes, análises, e integração com sistemas biométricos.

**Base URL:** `https://api.tascadovereda.com/api`

**Versão:** 1.0.0

---

## Autenticação

Todas as requisições à API devem incluir headers de autenticação:

```bash
Authorization: Bearer sk_live_xxxxxxxxxxxxx
X-API-Secret: secret_xxxxxxxxxxxxx
```

### Gerar API Key

1. Aceda a **Desenvolvedor > API Keys**
2. Clique em **Gerar Nova**
3. Copie a chave pública e secreta (a secreta só aparece uma vez)
4. Use no header `Authorization` a chave pública e no header `X-API-Secret` a secreta

### Escopos de Permissão

Cada API Key tem escopos que limitam o acesso:

- `orders.read` - Leitura de pedidos
- `orders.write` - Criar/atualizar pedidos
- `customers.read` - Leitura de clientes
- `customers.write` - Criar/atualizar clientes
- `dashboard.read` - Acesso ao dashboard
- `analytics.read` - Leitura de análises
- `attendance.read` - Leitura de registos de presença
- `attendance.write` - Criar registos de presença
- `inventory.read` - Leitura de inventário
- `biometric.write` - Enviar eventos biométricos

---

## Endpoints Principais

### Dashboard

#### Obter Resumo do Dashboard
```http
GET /dashboard/summary
```

**Resposta:**
```json
{
  "totalRevenue": 45000,
  "totalOrders": 28,
  "avgOrderValue": 1607,
  "peakHour": 12,
  "topDish": "Arroz de Marisco",
  "employeesWorking": 5,
  "tablesOccupied": 8,
  "lastUpdated": "2024-01-25T16:30:00Z"
}
```

---

### Pedidos

#### Listar Pedidos
```http
GET /orders?status=ABERTO&limit=10&offset=0
```

**Parâmetros Query:**
- `status` - ABERTO, FECHADO, CANCELADO
- `limit` - Número máximo de resultados (padrão: 20)
- `offset` - Paginação (padrão: 0)

**Resposta:**
```json
{
  "orders": [
    {
      "id": "order-123",
      "tableId": 5,
      "status": "ABERTO",
      "items": [
        {
          "dishId": "dish-1",
          "dishName": "Arroz de Marisco",
          "quantity": 2,
          "price": 2500,
          "total": 5000,
          "notes": "Sem alho"
        }
      ],
      "total": 5000,
      "timestamp": "2024-01-25T16:15:00Z"
    }
  ],
  "total": 28
}
```

#### Criar Pedido
```http
POST /orders
```

**Body:**
```json
{
  "tableId": 5,
  "items": [
    {
      "dishId": "dish-1",
      "quantity": 2,
      "notes": "Sem alho"
    }
  ]
}
```

**Resposta:**
```json
{
  "id": "order-123",
  "tableId": 5,
  "status": "ABERTO",
  "items": [...],
  "total": 5000,
  "timestamp": "2024-01-25T16:15:00Z"
}
```

#### Adicionar Item ao Pedido
```http
POST /orders/{orderId}/items
```

**Body:**
```json
{
  "dishId": "dish-2",
  "quantity": 1,
  "notes": "Com temperatura média"
}
```

#### Fechar Pedido (Checkout)
```http
POST /orders/{orderId}/checkout
```

**Body:**
```json
{
  "paymentMethod": "CARTAO",
  "paymentValue": 5000,
  "discount": 0
}
```

---

### Clientes

#### Listar Clientes
```http
GET /customers?limit=20&offset=0
```

**Resposta:**
```json
{
  "customers": [
    {
      "id": "customer-1",
      "name": "João Silva",
      "phone": "+244 912 345 678",
      "email": "joao@email.com",
      "points": 1500,
      "totalSpent": 45000,
      "registeredAt": "2023-06-15T10:00:00Z"
    }
  ],
  "total": 342
}
```

#### Obter Cliente
```http
GET /customers/{customerId}
```

#### Registar Novo Cliente
```http
POST /customers
```

**Body:**
```json
{
  "name": "Maria Santos",
  "phone": "+244 912 987 654",
  "email": "maria@email.com"
}
```

#### Adicionar Pontos de Lealdade
```http
POST /customers/{customerId}/loyalty-points
```

**Body:**
```json
{
  "points": 100,
  "reason": "Compra realizada"
}
```

---

### Análises

#### Obter Resumo de Análises
```http
GET /analytics/summary
```

**Resposta:**
```json
{
  "dailyRevenue": 45000,
  "dailyOrders": 28,
  "avgOrderValue": 1607,
  "topMenuItems": [
    {
      "dishName": "Arroz de Marisco",
      "sold": 12,
      "revenue": 30000
    }
  ]
}
```

#### Obter Análises Diárias
```http
GET /analytics/daily?days=7
```

**Parâmetros:**
- `days` - Número de dias a retornar (padrão: 30)

---

### Presença/Attendance

#### Obter Registos de Presença
```http
GET /attendance?employeeId=emp-1&startDate=2024-01-01&endDate=2024-01-31
```

**Resposta:**
```json
{
  "attendance": [
    {
      "id": "att-1",
      "employeeId": "emp-1",
      "date": "2024-01-25",
      "clockIn": "2024-01-25T08:00:00Z",
      "clockOut": "2024-01-25T17:00:00Z",
      "totalHours": 9,
      "isLate": false,
      "lateMinutes": 0,
      "overtimeHours": 1
    }
  ]
}
```

#### Registar Entrada (Clock In)
```http
POST /attendance/clock-in
```

**Body:**
```json
{
  "employeeId": "emp-1"
}
```

#### Registar Saída (Clock Out)
```http
POST /attendance/clock-out
```

**Body:**
```json
{
  "employeeId": "emp-1"
}
```

---

### Biométrico

#### Enviar Evento Biométrico
```http
POST /biometric/webhook
```

**Body:**
```json
{
  "deviceId": "device-1",
  "externalBioId": "EMP001",
  "type": "CLOCK_IN",
  "clockTime": "2024-01-25T08:15:00Z",
  "temperature": 36.5
}
```

**Resposta:**
```json
{
  "success": true,
  "attendanceId": "att-123",
  "message": "Presença registada com sucesso"
}
```

**Tipos de Evento:**
- `CLOCK_IN` - Entrada
- `CLOCK_OUT` - Saída

---

### Inventário

#### Obter Inventário
```http
GET /inventory?filters=lowstock
```

**Parâmetros:**
- `filters` - lowstock, expiring, all

**Resposta:**
```json
{
  "inventory": [
    {
      "id": "item-1",
      "name": "Arroz",
      "quantity": 5,
      "unit": "kg",
      "minQuantity": 10,
      "isLow": true
    }
  ]
}
```

---

### Despesas

#### Criar Despesa
```http
POST /expenses
```

**Body:**
```json
{
  "description": "Horas extras - João Silva",
  "amount": 2500,
  "category": "SALARIOS",
  "date": "2024-01-25"
}
```

#### Obter Despesas
```http
GET /expenses?startDate=2024-01-01&endDate=2024-01-31
```

---

## Webhooks

### Configurar Webhook

Na seção **Desenvolvedor > Webhooks**, clique em **Adicionar Webhook** e configure:

- **Nome:** Identificação do webhook
- **URL:** Endpoint da sua aplicação que receberá os eventos
- **Eventos:** Selecione quais eventos disparar
- **Headers Customizados:** Headers adicionais (ex: autenticação)

### Eventos Disponíveis

#### order.created
Disparado quando um novo pedido é criado.

```json
{
  "event": "order.created",
  "timestamp": "2024-01-25T16:15:00Z",
  "data": {
    "id": "order-123",
    "tableId": 5,
    "items": [...],
    "total": 5000
  }
}
```

#### order.closed
Disparado quando um pedido é fechado.

```json
{
  "event": "order.closed",
  "timestamp": "2024-01-25T16:45:00Z",
  "data": {
    "id": "order-123",
    "total": 5000,
    "paymentMethod": "CARTAO"
  }
}
```

#### attendance.clockin
Disparado quando um funcionário regista entrada.

```json
{
  "event": "attendance.clockin",
  "timestamp": "2024-01-25T08:00:00Z",
  "data": {
    "employeeId": "emp-1",
    "clockIn": "2024-01-25T08:00:00Z",
    "temperature": 36.5
  }
}
```

#### attendance.clockout
Disparado quando um funcionário regista saída.

```json
{
  "event": "attendance.clockout",
  "timestamp": "2024-01-25T17:00:00Z",
  "data": {
    "employeeId": "emp-1",
    "clockOut": "2024-01-25T17:00:00Z"
  }
}
```

#### payment.completed
Disparado quando um pagamento é completado.

```json
{
  "event": "payment.completed",
  "timestamp": "2024-01-25T16:45:00Z",
  "data": {
    "orderId": "order-123",
    "amount": 5000,
    "method": "CARTAO"
  }
}
```

#### inventory.low
Disparado quando um item fica com quantidade baixa.

```json
{
  "event": "inventory.low",
  "timestamp": "2024-01-25T14:00:00Z",
  "data": {
    "itemId": "item-1",
    "name": "Arroz",
    "quantity": 5,
    "minQuantity": 10
  }
}
```

#### customer.registered
Disparado quando um novo cliente é registado.

```json
{
  "event": "customer.registered",
  "timestamp": "2024-01-25T16:30:00Z",
  "data": {
    "id": "customer-1",
    "name": "João Silva",
    "phone": "+244 912 345 678"
  }
}
```

### Processar Webhook

Quando sua aplicação receber um webhook:

1. **Validar Origin:** Verifique que o header `X-API-Secret` corresponde à sua chave
2. **Processar Dados:** Processe o evento
3. **Responder:** Retorne HTTP 200 OK dentro de 30 segundos

**Exemplo (Node.js):**
```javascript
app.post('/webhook/tasca', (req, res) => {
  const { event, data } = req.body;
  const apiSecret = req.headers['x-api-secret'];

  if (apiSecret !== process.env.TASCA_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (event === 'order.created') {
    console.log('Novo pedido:', data);
  }

  res.status(200).json({ received: true });
});
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Recurso não encontrado |
| 429 | Muitas requisições (rate limit) |
| 500 | Erro interno do servidor |

---

## Rate Limiting

As requisições são limitadas a:

- **100 requisições por minuto** para APIs de leitura
- **20 requisições por minuto** para APIs de escrita

Headers de resposta informam o status:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701001234
```

---

## Exemplos de Integração

### cURL

**Obter Dashboard:**
```bash
curl -X GET https://api.tascadovereda.com/api/dashboard/summary \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxx"
```

**Criar Pedido:**
```bash
curl -X POST https://api.tascadovereda.com/api/orders \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": 5,
    "items": [{"dishId": "dish-1", "quantity": 2}]
  }'
```

### JavaScript

```javascript
const apiKey = 'sk_live_xxxxxxxxxxxxx';
const apiSecret = 'secret_xxxxxxxxxxxxx';

async function getDashboard() {
  const response = await fetch(
    'https://api.tascadovereda.com/api/dashboard/summary',
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret
      }
    }
  );
  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'sk_live_xxxxxxxxxxxxx'
API_SECRET = 'secret_xxxxxxxxxxxxx'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'X-API-Secret': API_SECRET
}

response = requests.get(
    'https://api.tascadovereda.com/api/dashboard/summary',
    headers=headers
)
print(response.json())
```

---

## Suporte

Para questões sobre a API:

- 📧 Email: dev@tascadovereda.com
- 💬 Discord: [Link da comunidade]
- 📖 Docs: [Link da documentação]

---

**Última atualização:** Janeiro 2024  
**Versão API:** 1.0.0
=======
# API Documentation - Tasca do Vereda

## Visão Geral

A API de integração do Tasca do Vereda permite que aplicações terceiras acessem e gerenciem dados do seu restaurante em tempo real, incluindo pedidos, clientes, análises, e integração com sistemas biométricos.

**Base URL:** `https://api.tascadovereda.com/api`

**Versão:** 1.0.0

---

## Autenticação

Todas as requisições à API devem incluir headers de autenticação:

```bash
Authorization: Bearer sk_live_xxxxxxxxxxxxx
X-API-Secret: secret_xxxxxxxxxxxxx
```

### Gerar API Key

1. Aceda a **Desenvolvedor > API Keys**
2. Clique em **Gerar Nova**
3. Copie a chave pública e secreta (a secreta só aparece uma vez)
4. Use no header `Authorization` a chave pública e no header `X-API-Secret` a secreta

### Escopos de Permissão

Cada API Key tem escopos que limitam o acesso:

- `orders.read` - Leitura de pedidos
- `orders.write` - Criar/atualizar pedidos
- `customers.read` - Leitura de clientes
- `customers.write` - Criar/atualizar clientes
- `dashboard.read` - Acesso ao dashboard
- `analytics.read` - Leitura de análises
- `attendance.read` - Leitura de registos de presença
- `attendance.write` - Criar registos de presença
- `inventory.read` - Leitura de inventário
- `biometric.write` - Enviar eventos biométricos

---

## Endpoints Principais

### Dashboard

#### Obter Resumo do Dashboard
```http
GET /dashboard/summary
```

**Resposta:**
```json
{
  "totalRevenue": 45000,
  "totalOrders": 28,
  "avgOrderValue": 1607,
  "peakHour": 12,
  "topDish": "Arroz de Marisco",
  "employeesWorking": 5,
  "tablesOccupied": 8,
  "lastUpdated": "2024-01-25T16:30:00Z"
}
```

---

### Pedidos

#### Listar Pedidos
```http
GET /orders?status=ABERTO&limit=10&offset=0
```

**Parâmetros Query:**
- `status` - ABERTO, FECHADO, CANCELADO
- `limit` - Número máximo de resultados (padrão: 20)
- `offset` - Paginação (padrão: 0)

**Resposta:**
```json
{
  "orders": [
    {
      "id": "order-123",
      "tableId": 5,
      "status": "ABERTO",
      "items": [
        {
          "dishId": "dish-1",
          "dishName": "Arroz de Marisco",
          "quantity": 2,
          "price": 2500,
          "total": 5000,
          "notes": "Sem alho"
        }
      ],
      "total": 5000,
      "timestamp": "2024-01-25T16:15:00Z"
    }
  ],
  "total": 28
}
```

#### Criar Pedido
```http
POST /orders
```

**Body:**
```json
{
  "tableId": 5,
  "items": [
    {
      "dishId": "dish-1",
      "quantity": 2,
      "notes": "Sem alho"
    }
  ]
}
```

**Resposta:**
```json
{
  "id": "order-123",
  "tableId": 5,
  "status": "ABERTO",
  "items": [...],
  "total": 5000,
  "timestamp": "2024-01-25T16:15:00Z"
}
```

#### Adicionar Item ao Pedido
```http
POST /orders/{orderId}/items
```

**Body:**
```json
{
  "dishId": "dish-2",
  "quantity": 1,
  "notes": "Com temperatura média"
}
```

#### Fechar Pedido (Checkout)
```http
POST /orders/{orderId}/checkout
```

**Body:**
```json
{
  "paymentMethod": "CARTAO",
  "paymentValue": 5000,
  "discount": 0
}
```

---

### Clientes

#### Listar Clientes
```http
GET /customers?limit=20&offset=0
```

**Resposta:**
```json
{
  "customers": [
    {
      "id": "customer-1",
      "name": "João Silva",
      "phone": "+244 912 345 678",
      "email": "joao@email.com",
      "points": 1500,
      "totalSpent": 45000,
      "registeredAt": "2023-06-15T10:00:00Z"
    }
  ],
  "total": 342
}
```

#### Obter Cliente
```http
GET /customers/{customerId}
```

#### Registar Novo Cliente
```http
POST /customers
```

**Body:**
```json
{
  "name": "Maria Santos",
  "phone": "+244 912 987 654",
  "email": "maria@email.com"
}
```

#### Adicionar Pontos de Lealdade
```http
POST /customers/{customerId}/loyalty-points
```

**Body:**
```json
{
  "points": 100,
  "reason": "Compra realizada"
}
```

---

### Análises

#### Obter Resumo de Análises
```http
GET /analytics/summary
```

**Resposta:**
```json
{
  "dailyRevenue": 45000,
  "dailyOrders": 28,
  "avgOrderValue": 1607,
  "topMenuItems": [
    {
      "dishName": "Arroz de Marisco",
      "sold": 12,
      "revenue": 30000
    }
  ]
}
```

#### Obter Análises Diárias
```http
GET /analytics/daily?days=7
```

**Parâmetros:**
- `days` - Número de dias a retornar (padrão: 30)

---

### Presença/Attendance

#### Obter Registos de Presença
```http
GET /attendance?employeeId=emp-1&startDate=2024-01-01&endDate=2024-01-31
```

**Resposta:**
```json
{
  "attendance": [
    {
      "id": "att-1",
      "employeeId": "emp-1",
      "date": "2024-01-25",
      "clockIn": "2024-01-25T08:00:00Z",
      "clockOut": "2024-01-25T17:00:00Z",
      "totalHours": 9,
      "isLate": false,
      "lateMinutes": 0,
      "overtimeHours": 1
    }
  ]
}
```

#### Registar Entrada (Clock In)
```http
POST /attendance/clock-in
```

**Body:**
```json
{
  "employeeId": "emp-1"
}
```

#### Registar Saída (Clock Out)
```http
POST /attendance/clock-out
```

**Body:**
```json
{
  "employeeId": "emp-1"
}
```

---

### Biométrico

#### Enviar Evento Biométrico
```http
POST /biometric/webhook
```

**Body:**
```json
{
  "deviceId": "device-1",
  "externalBioId": "EMP001",
  "type": "CLOCK_IN",
  "clockTime": "2024-01-25T08:15:00Z",
  "temperature": 36.5
}
```

**Resposta:**
```json
{
  "success": true,
  "attendanceId": "att-123",
  "message": "Presença registada com sucesso"
}
```

**Tipos de Evento:**
- `CLOCK_IN` - Entrada
- `CLOCK_OUT` - Saída

---

### Inventário

#### Obter Inventário
```http
GET /inventory?filters=lowstock
```

**Parâmetros:**
- `filters` - lowstock, expiring, all

**Resposta:**
```json
{
  "inventory": [
    {
      "id": "item-1",
      "name": "Arroz",
      "quantity": 5,
      "unit": "kg",
      "minQuantity": 10,
      "isLow": true
    }
  ]
}
```

---

### Despesas

#### Criar Despesa
```http
POST /expenses
```

**Body:**
```json
{
  "description": "Horas extras - João Silva",
  "amount": 2500,
  "category": "SALARIOS",
  "date": "2024-01-25"
}
```

#### Obter Despesas
```http
GET /expenses?startDate=2024-01-01&endDate=2024-01-31
```

---

## Webhooks

### Configurar Webhook

Na seção **Desenvolvedor > Webhooks**, clique em **Adicionar Webhook** e configure:

- **Nome:** Identificação do webhook
- **URL:** Endpoint da sua aplicação que receberá os eventos
- **Eventos:** Selecione quais eventos disparar
- **Headers Customizados:** Headers adicionais (ex: autenticação)

### Eventos Disponíveis

#### order.created
Disparado quando um novo pedido é criado.

```json
{
  "event": "order.created",
  "timestamp": "2024-01-25T16:15:00Z",
  "data": {
    "id": "order-123",
    "tableId": 5,
    "items": [...],
    "total": 5000
  }
}
```

#### order.closed
Disparado quando um pedido é fechado.

```json
{
  "event": "order.closed",
  "timestamp": "2024-01-25T16:45:00Z",
  "data": {
    "id": "order-123",
    "total": 5000,
    "paymentMethod": "CARTAO"
  }
}
```

#### attendance.clockin
Disparado quando um funcionário regista entrada.

```json
{
  "event": "attendance.clockin",
  "timestamp": "2024-01-25T08:00:00Z",
  "data": {
    "employeeId": "emp-1",
    "clockIn": "2024-01-25T08:00:00Z",
    "temperature": 36.5
  }
}
```

#### attendance.clockout
Disparado quando um funcionário regista saída.

```json
{
  "event": "attendance.clockout",
  "timestamp": "2024-01-25T17:00:00Z",
  "data": {
    "employeeId": "emp-1",
    "clockOut": "2024-01-25T17:00:00Z"
  }
}
```

#### payment.completed
Disparado quando um pagamento é completado.

```json
{
  "event": "payment.completed",
  "timestamp": "2024-01-25T16:45:00Z",
  "data": {
    "orderId": "order-123",
    "amount": 5000,
    "method": "CARTAO"
  }
}
```

#### inventory.low
Disparado quando um item fica com quantidade baixa.

```json
{
  "event": "inventory.low",
  "timestamp": "2024-01-25T14:00:00Z",
  "data": {
    "itemId": "item-1",
    "name": "Arroz",
    "quantity": 5,
    "minQuantity": 10
  }
}
```

#### customer.registered
Disparado quando um novo cliente é registado.

```json
{
  "event": "customer.registered",
  "timestamp": "2024-01-25T16:30:00Z",
  "data": {
    "id": "customer-1",
    "name": "João Silva",
    "phone": "+244 912 345 678"
  }
}
```

### Processar Webhook

Quando sua aplicação receber um webhook:

1. **Validar Origin:** Verifique que o header `X-API-Secret` corresponde à sua chave
2. **Processar Dados:** Processe o evento
3. **Responder:** Retorne HTTP 200 OK dentro de 30 segundos

**Exemplo (Node.js):**
```javascript
app.post('/webhook/tasca', (req, res) => {
  const { event, data } = req.body;
  const apiSecret = req.headers['x-api-secret'];

  if (apiSecret !== process.env.TASCA_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (event === 'order.created') {
    console.log('Novo pedido:', data);
  }

  res.status(200).json({ received: true });
});
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Recurso não encontrado |
| 429 | Muitas requisições (rate limit) |
| 500 | Erro interno do servidor |

---

## Rate Limiting

As requisições são limitadas a:

- **100 requisições por minuto** para APIs de leitura
- **20 requisições por minuto** para APIs de escrita

Headers de resposta informam o status:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701001234
```

---

## Exemplos de Integração

### cURL

**Obter Dashboard:**
```bash
curl -X GET https://api.tascadovereda.com/api/dashboard/summary \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxx"
```

**Criar Pedido:**
```bash
curl -X POST https://api.tascadovereda.com/api/orders \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": 5,
    "items": [{"dishId": "dish-1", "quantity": 2}]
  }'
```

### JavaScript

```javascript
const apiKey = 'sk_live_xxxxxxxxxxxxx';
const apiSecret = 'secret_xxxxxxxxxxxxx';

async function getDashboard() {
  const response = await fetch(
    'https://api.tascadovereda.com/api/dashboard/summary',
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret
      }
    }
  );
  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'sk_live_xxxxxxxxxxxxx'
API_SECRET = 'secret_xxxxxxxxxxxxx'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'X-API-Secret': API_SECRET
}

response = requests.get(
    'https://api.tascadovereda.com/api/dashboard/summary',
    headers=headers
)
print(response.json())
```

---

## Suporte

Para questões sobre a API:

- 📧 Email: dev@tascadovereda.com
- 💬 Discord: [Link da comunidade]
- 📖 Docs: [Link da documentação]

---

**Última atualização:** Janeiro 2024  
**Versão API:** 1.0.0
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
