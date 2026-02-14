<<<<<<< HEAD
# 📱 Sistema de QR Code Menu - Documentação Completa

## 🎯 Visão Geral

O sistema de QR Code Menu permite que clientes acessem o menu online simplesmente escaneando um código QR. Perfeito para:

- ✅ Reduzir custos de cardápios impressos
- ✅ Permitir atualizações de menu em tempo real
- ✅ Rastrear interesse dos clientes
- ✅ Facilitar pedidos especiais e personalizações
- ✅ Integração automática com sistema de pedidos

---

## 🚀 Setup Rápido

### 1. Instalar Dependência do QR Code

```bash
npm install qrcode.react
```

### 2. Descomentar no Componente QRCodeDisplay

Arquivo: `components/QRCodeDisplay.tsx`

Localize:
```typescript
{/* Aqui será renderizado o QR code quando qrcode.react estiver instalado */}
{/* <QRCode value={menuUrl} size={256} level="H" /> */}
```

Descomente para:
```typescript
<QRCode value={menuUrl} size={256} level="H" />
```

### 3. Pronto!

Agora você tem QR codes funcionais na sua aplicação.

---

## 📋 Estrutura de Arquivos

```
services/
  qrMenuService.ts         # Serviço de utilidades para QR codes
  
components/
  QRCodeDisplay.tsx        # Componente reutilizável de exibição
  
pages/
  QRMenuManager.tsx        # Página completa de gestão de QR
  QRCodeAnalytics.tsx      # Dashboard de análise de acessos
  
hooks/
  useQRMenu.ts             # Hooks customizados para QR

store/
  useStore.ts              # Estado global (qrCodeConfig, menuAccessLogs)
```

---

## 🔧 Componentes

### QRCodeDisplay
Componente reutilizável para exibir QR code com opções de compartilhamento.

**Props:**
```typescript
interface QRCodeDisplayProps {
  compact?: boolean;        // Modo compacto (padrão: false)
  showStats?: boolean;      // Mostrar estatísticas (padrão: true)
  onShare?: (platform: string) => void;
}
```

**Uso:**
```tsx
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function Settings() {
  return <QRCodeDisplay compact={false} showStats={true} />;
}
```

### QRMenuManager
Página completa para gerenciar e compartilhar QR codes.

**Funcionalidades:**
- 📊 Gerar QR code
- 🔗 Copiar URL do menu
- 📱 Compartilhar via WhatsApp, Telegram, SMS, Facebook
- 📄 Gerar código curto para cartazes
- 📥 Descarregar QR code em PNG
- 📋 Pré-visualizar menu online
- ⚙️ Configurações personalizadas

### QRCodeAnalytics
Dashboard de análise de acessos ao menu.

**Métricas:**
- Total de acessos
- Acessos hoje
- Acessos por tipo (público vs. tabela)
- Distribuição horária
- Tabelas mais acessadas
- Histórico de acessos

---

## 🛠️ Serviço: qrMenuService

### Funções Disponíveis

#### `generateMenuUrl(baseUrl, tableId?, sessionId?)`
Gera a URL para acessar o menu online.

```typescript
const url = generateMenuUrl('https://seu-restaurante.com');
// Resultado: https://seu-restaurante.com/menu/public

const tableUrl = generateMenuUrl('https://seu-restaurante.com', '5');
// Resultado: https://seu-restaurante.com/menu/public/5
```

#### `generateQRCodeData(url)`
Prepara dados para geração de QR code (compatível com qrcode.react).

```typescript
const qrData = generateQRCodeData(menuUrl);
// Uso com qrcode.react:
// <QRCode value={qrData} size={256} />
```

#### `generateMenuSessionId()`
Cria ID único para rastrear origem do pedido.

```typescript
const sessionId = generateMenuSessionId();
// Resultado: menu_1705012345678_7x9k2l
```

#### `generateShareableMenuLink(restaurantName, menuUrl, platform)`
Cria links para compartilhamento em redes sociais.

```typescript
const whatsappLink = generateShareableMenuLink(
  'Meu Restaurante',
  'https://seu-site.com/menu',
  'whatsapp'
);

// Suporta: 'whatsapp' | 'telegram' | 'sms' | 'facebook' | 'copy'
```

#### `generateMenuShortCode()`
Gera código curto (6 caracteres) para materiais impressos.

```typescript
const code = generateMenuShortCode();
// Resultado: ABC123, XYZ789, etc.
```

#### `generateMenuAccessToken()`
Cria token de acesso seguro para URLs protegidas.

```typescript
const token = generateMenuAccessToken();
// Resultado: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### `downloadQRCodeImage(element, filename)`
Descarrega QR code como arquivo PNG.

```typescript
const qrElement = document.getElementById('qr-container');
await downloadQRCodeImage(qrElement, 'menu-qr.png');
```

#### `generateQRCodePDF(qrCodeUrl, restaurantName)`
Gera PDF com QR code (requer jsPDF).

```bash
npm install jspdf
```

```typescript
await generateQRCodePDF('https://seu-site.com/qr-image.png', 'Meu Restaurante');
```

---

## 🎣 Hooks

### useQRMenu
Hook principal para gerenciar QR codes.

```typescript
import { useQRMenu } from '../hooks/useQRMenu';

function MyComponent() {
  const {
    baseUrl,
    menuUrl,
    sessionId,
    shortCode,
    accessToken,
    qrCodeData,
    isLoading,
    error,
    // Métodos:
    setBaseUrl,
    generateNewShortCode,
    copyUrlToClipboard,
    copyShortCodeToClipboard,
    getShareLink,
    downloadQR,
    clearError
  } = useQRMenu('https://seu-dominio.com');

  // Usar em template...
}
```

### useMenuAccessTracking
Rastreia acessos ao menu.

```typescript
const {
  accessLogs,
  logAccess,
  getAccessStats,
  clearLogs
} = useMenuAccessTracking();

// Registar acesso
logAccess({
  type: 'TABLE_MENU',
  tableId: '5',
  ip: '192.168.1.1'
});

// Obter estatísticas
const stats = getAccessStats();
// { total: 45, tableMenus: 30, publicMenus: 15, ... }
```

### useQRMenuVariants
Gerenciar múltiplas variações de QR (promoções, eventos, etc.).

```typescript
const {
  variants,
  addVariant,
  removeVariant,
  updateVariant,
  incrementScans,
  getVariantStats
} = useQRMenuVariants();

// Adicionar nova variação
addVariant('Promoção Natal', 'https://seu-site.com/natal');

// Incrementar scans
incrementScans('qr-123');
```

---

## 💾 Estado Global (Store)

### Adicionar Informações de QR ao Store

```typescript
const { 
  qrCodeConfig,
  menuAccessLogs,
  updateQRCodeConfig,
  logMenuAccess,
  getMenuAccessStats,
  clearMenuAccessLogs
} = useStore();

// Atualizar configuração
updateQRCodeConfig({
  baseUrl: 'https://novo-dominio.com',
  enabled: true
});

// Registar acesso
logMenuAccess({
  type: 'TABLE_MENU',
  tableId: '5',
  timestamp: new Date(),
  userAgent: navigator.userAgent
});

// Obter estatísticas
const stats = getMenuAccessStats();
// { total: 100, publicMenus: 60, tableMenus: 40, todayAccesses: 15 }
```

---

## 📊 Tipos de Dados

### QRCodeConfig
```typescript
interface QRCodeConfig {
  restaurantName: string;
  baseUrl: string;
  menuPath: string;        // Padrão: '/menu/public'
  enabled: boolean;
  scanCount: number;
  lastScanDate?: Date;
  createdAt: Date;
}
```

### MenuAccessLog
```typescript
interface MenuAccessLog {
  type: 'PUBLIC_MENU' | 'TABLE_MENU';
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  tableId?: string;
}
```

### QRMenuState
```typescript
interface QRMenuState {
  baseUrl: string;
  menuUrl: string;
  sessionId: string;
  shortCode: string;
  accessToken: string;
  qrCodeData: string;
  isLoading: boolean;
  error: string | null;
}
```

---

## 🌐 Integração com PublicMenu

A página `PublicMenu.tsx` já está configurada para receber acessos via QR code.

### URLs Suportadas

```
# Menu público genérico
/menu/public

# Menu por tabela específica
/menu/public/{tableId}

# Com sessão para rastreamento
/menu/public/{tableId}?session={sessionId}

# Com token de acesso
/menu/public?token={accessToken}
```

---

## 📱 Fluxo do Usuário

```
1. Cliente escaneia QR code
   ↓
2. Abre URL do menu público
   /menu/public/{tableId}
   ↓
3. PublicMenu.tsx carrega
   ↓
4. Exibe menu completo
   ↓
5. Cliente faz pedido
   ↓
6. Sistema registra origem (via sessionId/tableId)
   ↓
7. Analytics rastreiam acesso
```

---

## 🎨 Customização

### Mudar Cores do QR

No arquivo `qrMenuService.ts`, você pode customizar:

```typescript
// Adicionar no generateQRCodeData para suportar cores:
export const generateQRCodeData = (url: string, options?: {
  color?: string;
  bgColor?: string;
  size?: number;
}) => {
  // ... implementação com cores customizadas
}
```

### Adicionar Logo ao QR

Para adicionar logo no centro do QR:

```bash
npm install qr-code-styling
```

Substituir uso de `qrcode.react` por `qr-code-styling`.

---

## 🔒 Segurança

### Tokens de Acesso
- Gerados automaticamente para cada sessão
- Expiração configurável
- Validados antes de servir menu

### Rate Limiting
Adicionar rate limiting para evitar abusos:

```typescript
// No backend
const RateLimit = require('express-rate-limit');

const qrLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // max 100 requests por 15 minutos
});

app.get('/menu/public/:tableId', qrLimiter, (req, res) => {
  // ...
});
```

---

## 📈 Casos de Uso

### 1️⃣ Menu em Mesas
Imprima QR codes e coloque em cada mesa. Clientes podem:
- Ver menu completo
- Fazer pedidos
- Pedir conta
- Avaliações

### 2️⃣ Promoções
Crie variações de QR com códigos promocionais:
```
Menu Normal: /menu/public
Menu Promoção: /menu/public?promo=desconto20
Menu VIP: /menu/public?tier=vip
```

### 3️⃣ Compartilhamento Social
Clientes podem compartilhar menu:
- WhatsApp: "Vem comer aqui! [menu link]"
- Instagram: QR code na bio
- Facebook: Compartilhar página de menu

### 4️⃣ Marketing
Use código curto em publicidades:
- "Escaneia ABC123 para ver nosso menu"
- "Código no Instagram: XYZ789"
- Impressos, adesivos, cartazes

---

## 🐛 Troubleshooting

### QR Code não aparece
**Solução:** Descomentar a linha do `qrcode.react` em `QRCodeDisplay.tsx`

### Menu não carrega após scan
**Solução:** Verificar se `PublicMenu.tsx` está na rota `/menu/public/:tableId`

### Acessos não são registados
**Solução:** Chamar `logMenuAccess()` em `PublicMenu.tsx` no useEffect

### Download de QR não funciona
**Solução:** Verificar permissões do browser e CORS

---

## 📞 Suporte

Para mais informações ou reportar bugs:
- Consultar documentação do projeto
- Verificar console do browser
- Revisar logs do servidor

---

## ✅ Checklist de Implementação

- [ ] Instalar `qrcode.react`
- [ ] Descomentar linha no `QRCodeDisplay.tsx`
- [ ] Testar geração de QR code
- [ ] Imprimir QR codes para mesas
- [ ] Testar acesso via telefone
- [ ] Configurar base URL correta
- [ ] Integrar com página Settings
- [ ] Monitorar acessos no Analytics
- [ ] Treinar staff
- [ ] Coletar feedback de clientes

---

**Última atualização:** 2024
**Versão:** 1.0.0
=======
# 📱 Sistema de QR Code Menu - Documentação Completa

## 🎯 Visão Geral

O sistema de QR Code Menu permite que clientes acessem o menu online simplesmente escaneando um código QR. Perfeito para:

- ✅ Reduzir custos de cardápios impressos
- ✅ Permitir atualizações de menu em tempo real
- ✅ Rastrear interesse dos clientes
- ✅ Facilitar pedidos especiais e personalizações
- ✅ Integração automática com sistema de pedidos

---

## 🚀 Setup Rápido

### 1. Instalar Dependência do QR Code

```bash
npm install qrcode.react
```

### 2. Descomentar no Componente QRCodeDisplay

Arquivo: `components/QRCodeDisplay.tsx`

Localize:
```typescript
{/* Aqui será renderizado o QR code quando qrcode.react estiver instalado */}
{/* <QRCode value={menuUrl} size={256} level="H" /> */}
```

Descomente para:
```typescript
<QRCode value={menuUrl} size={256} level="H" />
```

### 3. Pronto!

Agora você tem QR codes funcionais na sua aplicação.

---

## 📋 Estrutura de Arquivos

```
services/
  qrMenuService.ts         # Serviço de utilidades para QR codes
  
components/
  QRCodeDisplay.tsx        # Componente reutilizável de exibição
  
pages/
  QRMenuManager.tsx        # Página completa de gestão de QR
  QRCodeAnalytics.tsx      # Dashboard de análise de acessos
  
hooks/
  useQRMenu.ts             # Hooks customizados para QR

store/
  useStore.ts              # Estado global (qrCodeConfig, menuAccessLogs)
```

---

## 🔧 Componentes

### QRCodeDisplay
Componente reutilizável para exibir QR code com opções de compartilhamento.

**Props:**
```typescript
interface QRCodeDisplayProps {
  compact?: boolean;        // Modo compacto (padrão: false)
  showStats?: boolean;      // Mostrar estatísticas (padrão: true)
  onShare?: (platform: string) => void;
}
```

**Uso:**
```tsx
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function Settings() {
  return <QRCodeDisplay compact={false} showStats={true} />;
}
```

### QRMenuManager
Página completa para gerenciar e compartilhar QR codes.

**Funcionalidades:**
- 📊 Gerar QR code
- 🔗 Copiar URL do menu
- 📱 Compartilhar via WhatsApp, Telegram, SMS, Facebook
- 📄 Gerar código curto para cartazes
- 📥 Descarregar QR code em PNG
- 📋 Pré-visualizar menu online
- ⚙️ Configurações personalizadas

### QRCodeAnalytics
Dashboard de análise de acessos ao menu.

**Métricas:**
- Total de acessos
- Acessos hoje
- Acessos por tipo (público vs. tabela)
- Distribuição horária
- Tabelas mais acessadas
- Histórico de acessos

---

## 🛠️ Serviço: qrMenuService

### Funções Disponíveis

#### `generateMenuUrl(baseUrl, tableId?, sessionId?)`
Gera a URL para acessar o menu online.

```typescript
const url = generateMenuUrl('https://seu-restaurante.com');
// Resultado: https://seu-restaurante.com/menu/public

const tableUrl = generateMenuUrl('https://seu-restaurante.com', '5');
// Resultado: https://seu-restaurante.com/menu/public/5
```

#### `generateQRCodeData(url)`
Prepara dados para geração de QR code (compatível com qrcode.react).

```typescript
const qrData = generateQRCodeData(menuUrl);
// Uso com qrcode.react:
// <QRCode value={qrData} size={256} />
```

#### `generateMenuSessionId()`
Cria ID único para rastrear origem do pedido.

```typescript
const sessionId = generateMenuSessionId();
// Resultado: menu_1705012345678_7x9k2l
```

#### `generateShareableMenuLink(restaurantName, menuUrl, platform)`
Cria links para compartilhamento em redes sociais.

```typescript
const whatsappLink = generateShareableMenuLink(
  'Meu Restaurante',
  'https://seu-site.com/menu',
  'whatsapp'
);

// Suporta: 'whatsapp' | 'telegram' | 'sms' | 'facebook' | 'copy'
```

#### `generateMenuShortCode()`
Gera código curto (6 caracteres) para materiais impressos.

```typescript
const code = generateMenuShortCode();
// Resultado: ABC123, XYZ789, etc.
```

#### `generateMenuAccessToken()`
Cria token de acesso seguro para URLs protegidas.

```typescript
const token = generateMenuAccessToken();
// Resultado: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### `downloadQRCodeImage(element, filename)`
Descarrega QR code como arquivo PNG.

```typescript
const qrElement = document.getElementById('qr-container');
await downloadQRCodeImage(qrElement, 'menu-qr.png');
```

#### `generateQRCodePDF(qrCodeUrl, restaurantName)`
Gera PDF com QR code (requer jsPDF).

```bash
npm install jspdf
```

```typescript
await generateQRCodePDF('https://seu-site.com/qr-image.png', 'Meu Restaurante');
```

---

## 🎣 Hooks

### useQRMenu
Hook principal para gerenciar QR codes.

```typescript
import { useQRMenu } from '../hooks/useQRMenu';

function MyComponent() {
  const {
    baseUrl,
    menuUrl,
    sessionId,
    shortCode,
    accessToken,
    qrCodeData,
    isLoading,
    error,
    // Métodos:
    setBaseUrl,
    generateNewShortCode,
    copyUrlToClipboard,
    copyShortCodeToClipboard,
    getShareLink,
    downloadQR,
    clearError
  } = useQRMenu('https://seu-dominio.com');

  // Usar em template...
}
```

### useMenuAccessTracking
Rastreia acessos ao menu.

```typescript
const {
  accessLogs,
  logAccess,
  getAccessStats,
  clearLogs
} = useMenuAccessTracking();

// Registar acesso
logAccess({
  type: 'TABLE_MENU',
  tableId: '5',
  ip: '192.168.1.1'
});

// Obter estatísticas
const stats = getAccessStats();
// { total: 45, tableMenus: 30, publicMenus: 15, ... }
```

### useQRMenuVariants
Gerenciar múltiplas variações de QR (promoções, eventos, etc.).

```typescript
const {
  variants,
  addVariant,
  removeVariant,
  updateVariant,
  incrementScans,
  getVariantStats
} = useQRMenuVariants();

// Adicionar nova variação
addVariant('Promoção Natal', 'https://seu-site.com/natal');

// Incrementar scans
incrementScans('qr-123');
```

---

## 💾 Estado Global (Store)

### Adicionar Informações de QR ao Store

```typescript
const { 
  qrCodeConfig,
  menuAccessLogs,
  updateQRCodeConfig,
  logMenuAccess,
  getMenuAccessStats,
  clearMenuAccessLogs
} = useStore();

// Atualizar configuração
updateQRCodeConfig({
  baseUrl: 'https://novo-dominio.com',
  enabled: true
});

// Registar acesso
logMenuAccess({
  type: 'TABLE_MENU',
  tableId: '5',
  timestamp: new Date(),
  userAgent: navigator.userAgent
});

// Obter estatísticas
const stats = getMenuAccessStats();
// { total: 100, publicMenus: 60, tableMenus: 40, todayAccesses: 15 }
```

---

## 📊 Tipos de Dados

### QRCodeConfig
```typescript
interface QRCodeConfig {
  restaurantName: string;
  baseUrl: string;
  menuPath: string;        // Padrão: '/menu/public'
  enabled: boolean;
  scanCount: number;
  lastScanDate?: Date;
  createdAt: Date;
}
```

### MenuAccessLog
```typescript
interface MenuAccessLog {
  type: 'PUBLIC_MENU' | 'TABLE_MENU';
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  tableId?: string;
}
```

### QRMenuState
```typescript
interface QRMenuState {
  baseUrl: string;
  menuUrl: string;
  sessionId: string;
  shortCode: string;
  accessToken: string;
  qrCodeData: string;
  isLoading: boolean;
  error: string | null;
}
```

---

## 🌐 Integração com PublicMenu

A página `PublicMenu.tsx` já está configurada para receber acessos via QR code.

### URLs Suportadas

```
# Menu público genérico
/menu/public

# Menu por tabela específica
/menu/public/{tableId}

# Com sessão para rastreamento
/menu/public/{tableId}?session={sessionId}

# Com token de acesso
/menu/public?token={accessToken}
```

---

## 📱 Fluxo do Usuário

```
1. Cliente escaneia QR code
   ↓
2. Abre URL do menu público
   /menu/public/{tableId}
   ↓
3. PublicMenu.tsx carrega
   ↓
4. Exibe menu completo
   ↓
5. Cliente faz pedido
   ↓
6. Sistema registra origem (via sessionId/tableId)
   ↓
7. Analytics rastreiam acesso
```

---

## 🎨 Customização

### Mudar Cores do QR

No arquivo `qrMenuService.ts`, você pode customizar:

```typescript
// Adicionar no generateQRCodeData para suportar cores:
export const generateQRCodeData = (url: string, options?: {
  color?: string;
  bgColor?: string;
  size?: number;
}) => {
  // ... implementação com cores customizadas
}
```

### Adicionar Logo ao QR

Para adicionar logo no centro do QR:

```bash
npm install qr-code-styling
```

Substituir uso de `qrcode.react` por `qr-code-styling`.

---

## 🔒 Segurança

### Tokens de Acesso
- Gerados automaticamente para cada sessão
- Expiração configurável
- Validados antes de servir menu

### Rate Limiting
Adicionar rate limiting para evitar abusos:

```typescript
// No backend
const RateLimit = require('express-rate-limit');

const qrLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // max 100 requests por 15 minutos
});

app.get('/menu/public/:tableId', qrLimiter, (req, res) => {
  // ...
});
```

---

## 📈 Casos de Uso

### 1️⃣ Menu em Mesas
Imprima QR codes e coloque em cada mesa. Clientes podem:
- Ver menu completo
- Fazer pedidos
- Pedir conta
- Avaliações

### 2️⃣ Promoções
Crie variações de QR com códigos promocionais:
```
Menu Normal: /menu/public
Menu Promoção: /menu/public?promo=desconto20
Menu VIP: /menu/public?tier=vip
```

### 3️⃣ Compartilhamento Social
Clientes podem compartilhar menu:
- WhatsApp: "Vem comer aqui! [menu link]"
- Instagram: QR code na bio
- Facebook: Compartilhar página de menu

### 4️⃣ Marketing
Use código curto em publicidades:
- "Escaneia ABC123 para ver nosso menu"
- "Código no Instagram: XYZ789"
- Impressos, adesivos, cartazes

---

## 🐛 Troubleshooting

### QR Code não aparece
**Solução:** Descomentar a linha do `qrcode.react` em `QRCodeDisplay.tsx`

### Menu não carrega após scan
**Solução:** Verificar se `PublicMenu.tsx` está na rota `/menu/public/:tableId`

### Acessos não são registados
**Solução:** Chamar `logMenuAccess()` em `PublicMenu.tsx` no useEffect

### Download de QR não funciona
**Solução:** Verificar permissões do browser e CORS

---

## 📞 Suporte

Para mais informações ou reportar bugs:
- Consultar documentação do projeto
- Verificar console do browser
- Revisar logs do servidor

---

## ✅ Checklist de Implementação

- [ ] Instalar `qrcode.react`
- [ ] Descomentar linha no `QRCodeDisplay.tsx`
- [ ] Testar geração de QR code
- [ ] Imprimir QR codes para mesas
- [ ] Testar acesso via telefone
- [ ] Configurar base URL correta
- [ ] Integrar com página Settings
- [ ] Monitorar acessos no Analytics
- [ ] Treinar staff
- [ ] Coletar feedback de clientes

---

**Última atualização:** 2024
**Versão:** 1.0.0
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
