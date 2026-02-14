<<<<<<< HEAD
# 🚀 QUICK START - Em 5 Minutos

## Passo 1: Adicionar Rotas ao App.tsx (1 minuto)

Abra seu `App.tsx` e substitua a seção de routes por:

```typescript
import { AppRoutes } from './config/routes';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <AppRoutes />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

Ou se já tiver um router customizado, adicione estas rotas:

```typescript
import MobileDashboard from './pages/MobileDashboard';
import DeveloperSettings from './pages/DeveloperSettings';

<Route path="/mobile-dashboard" element={<MobileDashboard />} />
<Route path="/developer-settings" element={<DeveloperSettings />} />
```

## Passo 2: Abrir Mobile Dashboard (1 minuto)

```
http://localhost:5173/mobile-dashboard
```

Deve ver:
- ✅ Faturamento do dia
- ✅ Pedidos ativos
- ✅ Equipa trabalhando
- ✅ 4 abas com dados

## Passo 3: Abrir Developer Settings (1 minuto)

```
http://localhost:5173/developer-settings
```

Deve ver 5 abas:
1. 🔑 API Keys
2. 🔗 Webhooks
3. 📱 Biométricos
4. 📊 Logs
5. 📖 Documentação

## Passo 4: Gerar API Key (1 minuto)

1. Vá para `/developer-settings`
2. Clique em **Gerar Nova**
3. Nome: `My Test Key`
4. Copie a chave (aparece só uma vez!)

```
sk_live_xxxxxxxxxxxxxxxxxxxxx
secret_xxxxxxxxxxxxxxxxxxxxx
```

## Passo 5: Testar API (1 minuto)

Abra o terminal e execute:

```bash
curl -X GET http://localhost:5173/api/dashboard/summary \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxxxxxxxxxx"
```

Deve retornar JSON com dashboard data!

---

## ✅ Feito! Agora...

### Para Telemóvel
- Abra `/mobile-dashboard` no browser
- Use DevTools (Ctrl+Shift+M) para view mobile
- Veja dados em tempo real
- Teste com dados do store

### Para Integrar Biométrico
1. `/developer-settings` → Biométricos
2. Clique **Registar Dispositivo**
3. Preencha IP do relógio (ex: 192.168.1.100)
4. Clique **Testar Conexão**
5. Se OK, device sincroniza automático

### Para Receber Webhooks
1. `/developer-settings` → Webhooks
2. Clique **Adicionar Webhook**
3. URL: `https://seu-servidor.com/webhook`
4. Eventos: `attendance.clockin, attendance.clockout`
5. Clique **Testar**

---

## 📚 Próximas Leituras

1. **`INTEGRATION_EXAMPLE.js`** - Ver como implementar no seu servidor
2. **`API_DOCUMENTATION.md`** - Referência completa de endpoints
3. **`INTEGRATIONS_SETUP_GUIDE.md`** - Guia detalhado
4. **`IMPLEMENTATION_SUMMARY.md`** - Visão geral técnica

---

## 🐛 Troubleshooting

### "Route not found"
- ✅ Importar `AppRoutes` do config/routes.tsx
- ✅ Usar dentro de `<Routes>`

### "Mobile Dashboard não carrega"
- ✅ Verificar se tem dados no store
- ✅ Abrir DevTools console para ver erros
- ✅ Verificar imports de tipos

### "API Key não funciona"
- ✅ Copiar exatamente (com sk_live_ e secret_)
- ✅ Usar em headers corretos
- ✅ Verificar typos

### "Webhook não funciona"
- ✅ URL deve ser público (não localhost)
- ✅ Endpoint deve aceitar POST
- ✅ Retornar 200 OK dentro de 30s
- ✅ Verificar em Developer > Logs

---

## 🎯 Arquitetura em 1 Página

```
┌─────────────────────────────────┐
│   App.tsx (Routes)              │
├─────────────────────────────────┤
│ ├─ /mobile-dashboard            │
│ │  └─ MobileDashboard.tsx       │
│ │     └─ useStore (dados)       │
│ └─ /developer-settings          │
│    └─ DeveloperSettings.tsx     │
│       └─ useIntegrations()      │
├─────────────────────────────────┤
│ Services                        │
│ ├─ BiometricService            │
│ └─ IntegrationAPIService       │
├─────────────────────────────────┤
│ Store (Zustand)                │
│ ├─ useStore (core)             │
│ └─ useIntegrations()           │
├─────────────────────────────────┤
│ External                        │
│ ├─ Biometric Device → Webhook  │
│ ├─ 3rd Party App → REST API    │
│ └─ Your Server ← Webhook       │
└─────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Case 1: Ver Dashboard no Telemóvel
```
Owner abre app mobile
  ↓
Vai para /mobile-dashboard
  ↓
Vê KPIs em tempo real
  ↓
Auto-atualiza a cada 10s
```

### Case 2: Receber Evento Biométrico
```
Colaborador faz check-in no relógio
  ↓
Relógio envia evento para webhook
  ↓
Sistema cria AttendanceRecord
  ↓
Auto-calcula horas/atraso/extras
  ↓
Auto-cria PayrollRecord se HE > 0
  ↓
Dispara webhook para sistemas externos
```

### Case 3: Integração de Terceiros
```
Sua App faz request:
  GET /api/orders
  Headers: Bearer + Secret
  ↓
API retorna orders JSON
  ↓
Sua app processa dados
  ↓
Atualiza POS/accounting/etc
```

---

## 🔧 Configurações Importantes

### Em `services/biometricService.ts`
```typescript
// Ajuste o intervalo de sincronização (minutos)
const syncInterval = 5; // Sincronizar a cada 5 min

// Ajuste o horário limite para "atrasado"
const lateThreshold = 8 * 60; // 8:00 AM

// Ajuste a taxa de desconto por atraso
const lateDiscountRate = 0.005; // 0.5%
```

### Em `services/integrationAPIService.ts`
```typescript
// Base URL da API (alterar para sua URL)
const baseURL = 'https://api.tascadovereda.com/api';

// Rate limits
const RATE_LIMITS = {
  read: 100,   // 100 requisições/minuto
  write: 20    // 20 requisições/minuto
};
```

---

## 📞 Suporte Rápido

**Problema: Mobile Dashboard vazio**
- [ ] Verificar se tem dados no store
- [ ] Executar: `console.log(useStore())` no DevTools
- [ ] Ver se useStore tem `activeOrders`, `employees`, etc

**Problema: API retorna erro 401**
- [ ] Verificar API key (must start with sk_live_)
- [ ] Verificar secret (must start with secret_)
- [ ] Verificar headers exatamente

**Problema: Webhook não recebe eventos**
- [ ] URL deve ser https:// (não localhost)
- [ ] Endpoint deve aceitar POST
- [ ] Retornar 200 OK rapidamente
- [ ] Ver em Developer > Logs para erros

**Problema: Device biométrico não conecta**
- [ ] Verificar IP address e port
- [ ] Fazer ping ao device: `ping 192.168.1.100`
- [ ] Testar conexão em Developer > Biométricos
- [ ] Ver logs para mensagem de erro

---

## ✨ Você tem acesso a:

- ✅ 2 páginas novas (Mobile + Developer)
- ✅ 2 serviços backend (Biometric + API)
- ✅ 1 módulo de store (Integrations)
- ✅ 20+ REST endpoints
- ✅ Webhook system
- ✅ Mobile sessions
- ✅ API keys & secrets
- ✅ Integration logging
- ✅ 2,500+ linhas de documentação
- ✅ Exemplos de código

---

## 🎓 Próximo Nível

Depois de dominar o quickstart:

1. Ler **INTEGRATIONS_SETUP_GUIDE.md** completo
2. Implementar biometric device real
3. Criar webhook handler próprio
4. Explorar todos os 20+ endpoints
5. Customizar UI conforme necessário

---

## 🎉 Parabéns!

Você agora tem uma aplicação com:
- ✅ Mobile access real-time
- ✅ Biometric integration
- ✅ Automated attendance
- ✅ Finance linking
- ✅ Developer API
- ✅ Complete logging

**Ready to deploy! 🚀**

---

**Tempo total:** ~5 minutos  
**Complexidade:** Fácil  
**Próximo passo:** Ler INTEGRATION_EXAMPLE.js
=======
# 🚀 QUICK START - Em 5 Minutos

## Passo 1: Adicionar Rotas ao App.tsx (1 minuto)

Abra seu `App.tsx` e substitua a seção de routes por:

```typescript
import { AppRoutes } from './config/routes';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <AppRoutes />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

Ou se já tiver um router customizado, adicione estas rotas:

```typescript
import MobileDashboard from './pages/MobileDashboard';
import DeveloperSettings from './pages/DeveloperSettings';

<Route path="/mobile-dashboard" element={<MobileDashboard />} />
<Route path="/developer-settings" element={<DeveloperSettings />} />
```

## Passo 2: Abrir Mobile Dashboard (1 minuto)

```
http://localhost:5173/mobile-dashboard
```

Deve ver:
- ✅ Faturamento do dia
- ✅ Pedidos ativos
- ✅ Equipa trabalhando
- ✅ 4 abas com dados

## Passo 3: Abrir Developer Settings (1 minuto)

```
http://localhost:5173/developer-settings
```

Deve ver 5 abas:
1. 🔑 API Keys
2. 🔗 Webhooks
3. 📱 Biométricos
4. 📊 Logs
5. 📖 Documentação

## Passo 4: Gerar API Key (1 minuto)

1. Vá para `/developer-settings`
2. Clique em **Gerar Nova**
3. Nome: `My Test Key`
4. Copie a chave (aparece só uma vez!)

```
sk_live_xxxxxxxxxxxxxxxxxxxxx
secret_xxxxxxxxxxxxxxxxxxxxx
```

## Passo 5: Testar API (1 minuto)

Abra o terminal e execute:

```bash
curl -X GET http://localhost:5173/api/dashboard/summary \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxx" \
  -H "X-API-Secret: secret_xxxxxxxxxxxxxxxxxxxxx"
```

Deve retornar JSON com dashboard data!

---

## ✅ Feito! Agora...

### Para Telemóvel
- Abra `/mobile-dashboard` no browser
- Use DevTools (Ctrl+Shift+M) para view mobile
- Veja dados em tempo real
- Teste com dados do store

### Para Integrar Biométrico
1. `/developer-settings` → Biométricos
2. Clique **Registar Dispositivo**
3. Preencha IP do relógio (ex: 192.168.1.100)
4. Clique **Testar Conexão**
5. Se OK, device sincroniza automático

### Para Receber Webhooks
1. `/developer-settings` → Webhooks
2. Clique **Adicionar Webhook**
3. URL: `https://seu-servidor.com/webhook`
4. Eventos: `attendance.clockin, attendance.clockout`
5. Clique **Testar**

---

## 📚 Próximas Leituras

1. **`INTEGRATION_EXAMPLE.js`** - Ver como implementar no seu servidor
2. **`API_DOCUMENTATION.md`** - Referência completa de endpoints
3. **`INTEGRATIONS_SETUP_GUIDE.md`** - Guia detalhado
4. **`IMPLEMENTATION_SUMMARY.md`** - Visão geral técnica

---

## 🐛 Troubleshooting

### "Route not found"
- ✅ Importar `AppRoutes` do config/routes.tsx
- ✅ Usar dentro de `<Routes>`

### "Mobile Dashboard não carrega"
- ✅ Verificar se tem dados no store
- ✅ Abrir DevTools console para ver erros
- ✅ Verificar imports de tipos

### "API Key não funciona"
- ✅ Copiar exatamente (com sk_live_ e secret_)
- ✅ Usar em headers corretos
- ✅ Verificar typos

### "Webhook não funciona"
- ✅ URL deve ser público (não localhost)
- ✅ Endpoint deve aceitar POST
- ✅ Retornar 200 OK dentro de 30s
- ✅ Verificar em Developer > Logs

---

## 🎯 Arquitetura em 1 Página

```
┌─────────────────────────────────┐
│   App.tsx (Routes)              │
├─────────────────────────────────┤
│ ├─ /mobile-dashboard            │
│ │  └─ MobileDashboard.tsx       │
│ │     └─ useStore (dados)       │
│ └─ /developer-settings          │
│    └─ DeveloperSettings.tsx     │
│       └─ useIntegrations()      │
├─────────────────────────────────┤
│ Services                        │
│ ├─ BiometricService            │
│ └─ IntegrationAPIService       │
├─────────────────────────────────┤
│ Store (Zustand)                │
│ ├─ useStore (core)             │
│ └─ useIntegrations()           │
├─────────────────────────────────┤
│ External                        │
│ ├─ Biometric Device → Webhook  │
│ ├─ 3rd Party App → REST API    │
│ └─ Your Server ← Webhook       │
└─────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Case 1: Ver Dashboard no Telemóvel
```
Owner abre app mobile
  ↓
Vai para /mobile-dashboard
  ↓
Vê KPIs em tempo real
  ↓
Auto-atualiza a cada 10s
```

### Case 2: Receber Evento Biométrico
```
Colaborador faz check-in no relógio
  ↓
Relógio envia evento para webhook
  ↓
Sistema cria AttendanceRecord
  ↓
Auto-calcula horas/atraso/extras
  ↓
Auto-cria PayrollRecord se HE > 0
  ↓
Dispara webhook para sistemas externos
```

### Case 3: Integração de Terceiros
```
Sua App faz request:
  GET /api/orders
  Headers: Bearer + Secret
  ↓
API retorna orders JSON
  ↓
Sua app processa dados
  ↓
Atualiza POS/accounting/etc
```

---

## 🔧 Configurações Importantes

### Em `services/biometricService.ts`
```typescript
// Ajuste o intervalo de sincronização (minutos)
const syncInterval = 5; // Sincronizar a cada 5 min

// Ajuste o horário limite para "atrasado"
const lateThreshold = 8 * 60; // 8:00 AM

// Ajuste a taxa de desconto por atraso
const lateDiscountRate = 0.005; // 0.5%
```

### Em `services/integrationAPIService.ts`
```typescript
// Base URL da API (alterar para sua URL)
const baseURL = 'https://api.tascadovereda.com/api';

// Rate limits
const RATE_LIMITS = {
  read: 100,   // 100 requisições/minuto
  write: 20    // 20 requisições/minuto
};
```

---

## 📞 Suporte Rápido

**Problema: Mobile Dashboard vazio**
- [ ] Verificar se tem dados no store
- [ ] Executar: `console.log(useStore())` no DevTools
- [ ] Ver se useStore tem `activeOrders`, `employees`, etc

**Problema: API retorna erro 401**
- [ ] Verificar API key (must start with sk_live_)
- [ ] Verificar secret (must start with secret_)
- [ ] Verificar headers exatamente

**Problema: Webhook não recebe eventos**
- [ ] URL deve ser https:// (não localhost)
- [ ] Endpoint deve aceitar POST
- [ ] Retornar 200 OK rapidamente
- [ ] Ver em Developer > Logs para erros

**Problema: Device biométrico não conecta**
- [ ] Verificar IP address e port
- [ ] Fazer ping ao device: `ping 192.168.1.100`
- [ ] Testar conexão em Developer > Biométricos
- [ ] Ver logs para mensagem de erro

---

## ✨ Você tem acesso a:

- ✅ 2 páginas novas (Mobile + Developer)
- ✅ 2 serviços backend (Biometric + API)
- ✅ 1 módulo de store (Integrations)
- ✅ 20+ REST endpoints
- ✅ Webhook system
- ✅ Mobile sessions
- ✅ API keys & secrets
- ✅ Integration logging
- ✅ 2,500+ linhas de documentação
- ✅ Exemplos de código

---

## 🎓 Próximo Nível

Depois de dominar o quickstart:

1. Ler **INTEGRATIONS_SETUP_GUIDE.md** completo
2. Implementar biometric device real
3. Criar webhook handler próprio
4. Explorar todos os 20+ endpoints
5. Customizar UI conforme necessário

---

## 🎉 Parabéns!

Você agora tem uma aplicação com:
- ✅ Mobile access real-time
- ✅ Biometric integration
- ✅ Automated attendance
- ✅ Finance linking
- ✅ Developer API
- ✅ Complete logging

**Ready to deploy! 🚀**

---

**Tempo total:** ~5 minutos  
**Complexidade:** Fácil  
**Próximo passo:** Ler INTEGRATION_EXAMPLE.js
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
