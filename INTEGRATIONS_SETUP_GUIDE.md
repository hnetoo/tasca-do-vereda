<<<<<<< HEAD
# Integração das Novas Funcionalidades

## 📱 Mobile Dashboard
**Arquivo:** `pages/MobileDashboard.tsx`

### Como Adicionar ao App.tsx:

```typescript
import MobileDashboard from './pages/MobileDashboard';

// Dentro do router:
{
  path: '/mobile-dashboard',
  element: <MobileDashboard />
}

// Ou no menu sidebar:
{
  icon: <Smartphone />,
  label: 'Mobile',
  path: '/mobile-dashboard'
}
```

### Funcionalidades:
- ✅ Visão em tempo real do faturamento, pedidos ativos e equipa
- ✅ 4 abas: Vendas, Pedidos, Equipa, Análise
- ✅ Design responsivo para telemóveis
- ✅ Auto-refresh a cada 10 segundos
- ✅ Logout e sessão
- ✅ KPI cards com dados em tempo real

---

## 👨‍💻 Developer Settings
**Arquivo:** `pages/DeveloperSettings.tsx`

### Como Adicionar ao App.tsx:

```typescript
import DeveloperSettings from './pages/DeveloperSettings';

// Dentro do router:
{
  path: '/developer-settings',
  element: <DeveloperSettings />
}

// No menu para admins:
{
  icon: <Code />,
  label: 'Desenvolvedor',
  path: '/developer-settings'
}
```

### Funcionalidades:
- ✅ **API Keys** - Gerar, visualizar, revogar
- ✅ **Webhooks** - Criar, editar, testar
- ✅ **Biometric Devices** - Registar e testar conexão
- ✅ **Integration Logs** - Ver logs de todas as integrações
- ✅ **Documentação** - Guia integrado de como usar a API

---

## 🔌 Services (Backend)

### BiometricIntegrationService
**Arquivo:** `services/biometricService.ts`

Responsável por:
- Registar e desregistar dispositivos biométricos
- Sincronizar eventos de relógios
- Processar eventos de entrada/saída
- Calcular automaticamente: horas de trabalho, atrasos, horas extras
- Linkar com finanças (salários, descontos)
- Registar logs de integração

**Uso:**
```typescript
import { BiometricIntegrationService } from './services/biometricService';

const bioService = BiometricIntegrationService.getInstance();

// Registar dispositivo
bioService.registerDevice({
  id: 'device-1',
  name: 'Entrada',
  type: 'FINGERPRINT',
  ipAddress: '192.168.1.100',
  port: 4370,
  apiKey: 'key',
  status: 'CONNECTED',
  lastSync: new Date(),
  syncInterval: 5
});

// Processar evento webhook
bioService.handleWebhookEvent(clockEvent);
```

---

## 🌐 Integration API Service
**Arquivo:** `services/integrationAPIService.ts`

Expõe 20+ endpoints REST para terceiros:

```typescript
import { initializeIntegrationAPI } from './services/integrationAPIService';

const api = initializeIntegrationAPI('sk_live_xxx', 'secret_xxx');

// Dashboard
await api.getDashboardSummary();

// Pedidos
await api.getOrders();
await api.createOrder({ tableId: 5, items: [...] });
await api.checkoutOrder(orderId, 'CARTAO');

// Clientes
await api.getCustomers();
await api.addLoyaltyPoints(customerId, 100);

// Biométrico
await api.sendBiometricEvent({
  deviceId: 'device-1',
  externalBioId: 'EMP001',
  type: 'CLOCK_IN',
  clockTime: new Date().toISOString()
});

// Análises
await api.getAnalyticsSummary();
await api.getDailyAnalytics(7);
```

---

## 📋 Integrations Module
**Arquivo:** `store/integrationsModule.ts`

Hook Zustand para gerenciar:
- API Keys e validação
- Webhooks e disparo de eventos
- Devices biométricos
- Mobile Sessions
- Logs de integração

**Uso:**
```typescript
import { useIntegrations } from './store/integrationsModule';

const integrations = useIntegrations();

// API Keys
const newKey = integrations.generateAPIKey('My App', ['orders.read', 'customers.read']);
integrations.revokeAPIKey(keyId);

// Webhooks
integrations.addWebhook(webhookConfig);
await integrations.testWebhook(webhookId);
await integrations.triggerWebhook('order.created', orderData);

// Biometric
integrations.registerBiometricDevice(device);
await integrations.syncBiometricDevice(deviceId);

// Mobile Sessions
const session = integrations.createMobileSession(userId, deviceInfo);
const valid = integrations.validateMobileSession(token);

// Webhook biométrico
await integrations.processBiometricWebhook(payload);
```

---

## 📖 Documentação
**Arquivo:** `API_DOCUMENTATION.md`

Documentação completa com:
- ✅ Autenticação (Bearer token + Secret)
- ✅ 20+ endpoints explicados com exemplos
- ✅ Webhook events
- ✅ Rate limiting
- ✅ Exemplos em cURL, JavaScript, Python

---

## 🔌 Integração com Sistemas Biométricos

### Fluxo Completo:

```
Dispositivo Biométrico (Relógio)
        ↓
   [Clock Event]
   Usuário faz check-in/check-out
        ↓
Enviar para API Webhook
  POST /api/biometric/webhook
        ↓
BiometricIntegrationService processa:
  1. Encontra employee por externalBioId
  2. Cria/atualiza AttendanceRecord
  3. Calcula: horas, atrasos, horas extras
  4. Linká com finanças (salários, descontos)
        ↓
Gatilha Webhooks para sistemas externos
  (se configurado)
        ↓
Log de Integração registado
```

---

## 💰 Automação de Finanças

Quando um evento biométrico é processado:

1. **Cálculo de Atraso:**
   - Se clock-in > 8:00 AM → marcar como atrasado
   - Opcional: criar desconto automático

2. **Cálculo de Horas Extras:**
   - Se total de horas > 8 → registar horas extras
   - Automático: criar entrada de pagamento de HE

3. **Desconto Automático:**
   - Atraso: 0.5% do salário diário por minuto
   - Cria nova Expense automaticamente

---

## 🚀 Próximas Etapas

### 1. Integrar no App.tsx
```typescript
<Routes>
  <Route path="/mobile-dashboard" element={<MobileDashboard />} />
  <Route path="/developer-settings" element={<DeveloperSettings />} />
</Routes>
```

### 2. Registar Dispositivos
Via interface **Desenvolvedor > Biométricos**

### 3. Configurar Webhooks
Via interface **Desenvolvedor > Webhooks**

### 4. Gerar API Keys
Via interface **Desenvolvedor > API Keys**

### 5. Implementar Webhook Handler
Criar endpoint no seu servidor para receber eventos

### 6. Testar Integração
```bash
curl -X POST https://api.tascadovereda.com/api/biometric/webhook \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "X-API-Secret: secret_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-1",
    "externalBioId": "EMP001",
    "type": "CLOCK_IN",
    "clockTime": "2024-01-25T08:15:00Z",
    "temperature": 36.5
  }'
```

---

## 📝 Tipos TypeScript

Novos tipos adicionados a `types.ts`:

- `APIKey` - Chaves de API com scopes
- `WebhookConfig` - Configuração de webhooks
- `BiometricDevice` - Dispositivos biométricos
- `BiometricClockEvent` - Eventos de relógio
- `IntegrationLog` - Logs de integração
- `MobileSession` - Sessões mobile
- `RestrictedOrderView` - Visão restrita de pedidos
- `DashboardSummary` - Resumo do dashboard

---

## 🔐 Segurança

1. **API Keys** - Guardadas localmente, nunca em git
2. **Webhooks** - Header `X-API-Secret` validado
3. **Mobile Sessions** - Token com expiração de 24h
4. **Rate Limiting** - 100 req/min leitura, 20 req/min escrita
5. **Logs** - Todos os eventos registados para auditoria

---

## 📱 Responsive Design

As páginas funcionam bem em:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

Mobile Dashboard especialmente otimizado para telemóveis com:
- Botões grandes (touch-friendly)
- Cards compactos
- Scroll horizontal para tabelas
- Header sticky
- FAB (Floating Action Button)

---

## 🧪 Testando Localmente

1. **Mobile Dashboard:**
   ```
   http://localhost:5173/mobile-dashboard
   Ou abrir DevTools > Toggle Device Toolbar (Ctrl+Shift+M)
   ```

2. **Developer Settings:**
   ```
   http://localhost:5173/developer-settings
   Gerar chave, copiar, testar webhook
   ```

3. **API Webhook:**
   ```
   POST http://localhost:5173/api/biometric/webhook
   Headers:
     Authorization: Bearer sk_live_xxx
     X-API-Secret: secret_xxx
     Content-Type: application/json
   
   Body:
   {
     "deviceId": "device-1",
     "externalBioId": "EMP001",
     "type": "CLOCK_IN",
     "clockTime": "2024-01-25T08:15:00Z"
   }
   ```

---

## 📞 Suporte

Para dúvidas sobre integração:
- 📧 dev@tascadovereda.com
- 📖 Leia `API_DOCUMENTATION.md`
- 💻 Consulte `INTEGRATION_EXAMPLE.js` para exemplos
- 🐛 Verifique `Integration Logs` em Desenvolvedor

---

**Última atualização:** Janeiro 2024  
**Status:** ✅ Pronto para produção
=======
# Integração das Novas Funcionalidades

## 📱 Mobile Dashboard
**Arquivo:** `pages/MobileDashboard.tsx`

### Como Adicionar ao App.tsx:

```typescript
import MobileDashboard from './pages/MobileDashboard';

// Dentro do router:
{
  path: '/mobile-dashboard',
  element: <MobileDashboard />
}

// Ou no menu sidebar:
{
  icon: <Smartphone />,
  label: 'Mobile',
  path: '/mobile-dashboard'
}
```

### Funcionalidades:
- ✅ Visão em tempo real do faturamento, pedidos ativos e equipa
- ✅ 4 abas: Vendas, Pedidos, Equipa, Análise
- ✅ Design responsivo para telemóveis
- ✅ Auto-refresh a cada 10 segundos
- ✅ Logout e sessão
- ✅ KPI cards com dados em tempo real

---

## 👨‍💻 Developer Settings
**Arquivo:** `pages/DeveloperSettings.tsx`

### Como Adicionar ao App.tsx:

```typescript
import DeveloperSettings from './pages/DeveloperSettings';

// Dentro do router:
{
  path: '/developer-settings',
  element: <DeveloperSettings />
}

// No menu para admins:
{
  icon: <Code />,
  label: 'Desenvolvedor',
  path: '/developer-settings'
}
```

### Funcionalidades:
- ✅ **API Keys** - Gerar, visualizar, revogar
- ✅ **Webhooks** - Criar, editar, testar
- ✅ **Biometric Devices** - Registar e testar conexão
- ✅ **Integration Logs** - Ver logs de todas as integrações
- ✅ **Documentação** - Guia integrado de como usar a API

---

## 🔌 Services (Backend)

### BiometricIntegrationService
**Arquivo:** `services/biometricService.ts`

Responsável por:
- Registar e desregistar dispositivos biométricos
- Sincronizar eventos de relógios
- Processar eventos de entrada/saída
- Calcular automaticamente: horas de trabalho, atrasos, horas extras
- Linkar com finanças (salários, descontos)
- Registar logs de integração

**Uso:**
```typescript
import { BiometricIntegrationService } from './services/biometricService';

const bioService = BiometricIntegrationService.getInstance();

// Registar dispositivo
bioService.registerDevice({
  id: 'device-1',
  name: 'Entrada',
  type: 'FINGERPRINT',
  ipAddress: '192.168.1.100',
  port: 4370,
  apiKey: 'key',
  status: 'CONNECTED',
  lastSync: new Date(),
  syncInterval: 5
});

// Processar evento webhook
bioService.handleWebhookEvent(clockEvent);
```

---

## 🌐 Integration API Service
**Arquivo:** `services/integrationAPIService.ts`

Expõe 20+ endpoints REST para terceiros:

```typescript
import { initializeIntegrationAPI } from './services/integrationAPIService';

const api = initializeIntegrationAPI('sk_live_xxx', 'secret_xxx');

// Dashboard
await api.getDashboardSummary();

// Pedidos
await api.getOrders();
await api.createOrder({ tableId: 5, items: [...] });
await api.checkoutOrder(orderId, 'CARTAO');

// Clientes
await api.getCustomers();
await api.addLoyaltyPoints(customerId, 100);

// Biométrico
await api.sendBiometricEvent({
  deviceId: 'device-1',
  externalBioId: 'EMP001',
  type: 'CLOCK_IN',
  clockTime: new Date().toISOString()
});

// Análises
await api.getAnalyticsSummary();
await api.getDailyAnalytics(7);
```

---

## 📋 Integrations Module
**Arquivo:** `store/integrationsModule.ts`

Hook Zustand para gerenciar:
- API Keys e validação
- Webhooks e disparo de eventos
- Devices biométricos
- Mobile Sessions
- Logs de integração

**Uso:**
```typescript
import { useIntegrations } from './store/integrationsModule';

const integrations = useIntegrations();

// API Keys
const newKey = integrations.generateAPIKey('My App', ['orders.read', 'customers.read']);
integrations.revokeAPIKey(keyId);

// Webhooks
integrations.addWebhook(webhookConfig);
await integrations.testWebhook(webhookId);
await integrations.triggerWebhook('order.created', orderData);

// Biometric
integrations.registerBiometricDevice(device);
await integrations.syncBiometricDevice(deviceId);

// Mobile Sessions
const session = integrations.createMobileSession(userId, deviceInfo);
const valid = integrations.validateMobileSession(token);

// Webhook biométrico
await integrations.processBiometricWebhook(payload);
```

---

## 📖 Documentação
**Arquivo:** `API_DOCUMENTATION.md`

Documentação completa com:
- ✅ Autenticação (Bearer token + Secret)
- ✅ 20+ endpoints explicados com exemplos
- ✅ Webhook events
- ✅ Rate limiting
- ✅ Exemplos em cURL, JavaScript, Python

---

## 🔌 Integração com Sistemas Biométricos

### Fluxo Completo:

```
Dispositivo Biométrico (Relógio)
        ↓
   [Clock Event]
   Usuário faz check-in/check-out
        ↓
Enviar para API Webhook
  POST /api/biometric/webhook
        ↓
BiometricIntegrationService processa:
  1. Encontra employee por externalBioId
  2. Cria/atualiza AttendanceRecord
  3. Calcula: horas, atrasos, horas extras
  4. Linká com finanças (salários, descontos)
        ↓
Gatilha Webhooks para sistemas externos
  (se configurado)
        ↓
Log de Integração registado
```

---

## 💰 Automação de Finanças

Quando um evento biométrico é processado:

1. **Cálculo de Atraso:**
   - Se clock-in > 8:00 AM → marcar como atrasado
   - Opcional: criar desconto automático

2. **Cálculo de Horas Extras:**
   - Se total de horas > 8 → registar horas extras
   - Automático: criar entrada de pagamento de HE

3. **Desconto Automático:**
   - Atraso: 0.5% do salário diário por minuto
   - Cria nova Expense automaticamente

---

## 🚀 Próximas Etapas

### 1. Integrar no App.tsx
```typescript
<Routes>
  <Route path="/mobile-dashboard" element={<MobileDashboard />} />
  <Route path="/developer-settings" element={<DeveloperSettings />} />
</Routes>
```

### 2. Registar Dispositivos
Via interface **Desenvolvedor > Biométricos**

### 3. Configurar Webhooks
Via interface **Desenvolvedor > Webhooks**

### 4. Gerar API Keys
Via interface **Desenvolvedor > API Keys**

### 5. Implementar Webhook Handler
Criar endpoint no seu servidor para receber eventos

### 6. Testar Integração
```bash
curl -X POST https://api.tascadovereda.com/api/biometric/webhook \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "X-API-Secret: secret_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-1",
    "externalBioId": "EMP001",
    "type": "CLOCK_IN",
    "clockTime": "2024-01-25T08:15:00Z",
    "temperature": 36.5
  }'
```

---

## 📝 Tipos TypeScript

Novos tipos adicionados a `types.ts`:

- `APIKey` - Chaves de API com scopes
- `WebhookConfig` - Configuração de webhooks
- `BiometricDevice` - Dispositivos biométricos
- `BiometricClockEvent` - Eventos de relógio
- `IntegrationLog` - Logs de integração
- `MobileSession` - Sessões mobile
- `RestrictedOrderView` - Visão restrita de pedidos
- `DashboardSummary` - Resumo do dashboard

---

## 🔐 Segurança

1. **API Keys** - Guardadas localmente, nunca em git
2. **Webhooks** - Header `X-API-Secret` validado
3. **Mobile Sessions** - Token com expiração de 24h
4. **Rate Limiting** - 100 req/min leitura, 20 req/min escrita
5. **Logs** - Todos os eventos registados para auditoria

---

## 📱 Responsive Design

As páginas funcionam bem em:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

Mobile Dashboard especialmente otimizado para telemóveis com:
- Botões grandes (touch-friendly)
- Cards compactos
- Scroll horizontal para tabelas
- Header sticky
- FAB (Floating Action Button)

---

## 🧪 Testando Localmente

1. **Mobile Dashboard:**
   ```
   http://localhost:5173/mobile-dashboard
   Ou abrir DevTools > Toggle Device Toolbar (Ctrl+Shift+M)
   ```

2. **Developer Settings:**
   ```
   http://localhost:5173/developer-settings
   Gerar chave, copiar, testar webhook
   ```

3. **API Webhook:**
   ```
   POST http://localhost:5173/api/biometric/webhook
   Headers:
     Authorization: Bearer sk_live_xxx
     X-API-Secret: secret_xxx
     Content-Type: application/json
   
   Body:
   {
     "deviceId": "device-1",
     "externalBioId": "EMP001",
     "type": "CLOCK_IN",
     "clockTime": "2024-01-25T08:15:00Z"
   }
   ```

---

## 📞 Suporte

Para dúvidas sobre integração:
- 📧 dev@tascadovereda.com
- 📖 Leia `API_DOCUMENTATION.md`
- 💻 Consulte `INTEGRATION_EXAMPLE.js` para exemplos
- 🐛 Verifique `Integration Logs` em Desenvolvedor

---

**Última atualização:** Janeiro 2024  
**Status:** ✅ Pronto para produção
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
