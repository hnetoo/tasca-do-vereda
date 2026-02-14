<<<<<<< HEAD
# 🔗 Guia de Integração do QR Code Menu

## Adicionar Rotas ao App.tsx

Localize o arquivo `App.tsx` e adicione as rotas para os novos componentes de QR code.

### Código a Adicionar

```typescript
// Adicione estes imports no topo do App.tsx
import QRMenuManager from './pages/QRMenuManager';
import QRCodeAnalytics from './pages/QRCodeAnalytics';
import QRCodeDisplay from './components/QRCodeDisplay';

// Dentro da definição de rotas, adicione:
<Route path="/qr-menu" element={<QRMenuManager />} />
<Route path="/qr-analytics" element={<QRCodeAnalytics />} />
```

### Exemplo Completo de App.tsx (seção de rotas)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import QRMenuManager from './pages/QRMenuManager';
import QRCodeAnalytics from './pages/QRCodeAnalytics';
import PublicMenu from './pages/PublicMenu';
// ... outros imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Existentes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/menu/public/:tableId?" element={<PublicMenu />} />
        
        {/* Novas Rotas de QR Code */}
        <Route path="/qr-menu" element={<QRMenuManager />} />
        <Route path="/qr-analytics" element={<QRCodeAnalytics />} />
        
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Adicionar Botões de Navegação na Sidebar

Localize o arquivo `components/Sidebar.tsx` e adicione os botões para acessar o QR menu.

### Código a Adicionar

```tsx
// No array de items da sidebar, adicione:
{
  label: 'QR Code Menu',
  icon: QrCode,
  path: '/qr-menu',
  color: '#06b6d4'
},
{
  label: 'Análise QR',
  icon: BarChart3,
  path: '/qr-analytics',
  color: '#f59e0b'
}
```

### Adicionar Imports

```tsx
import { QrCode, BarChart3 } from 'lucide-react';
```

---

## Integrar QR Code Display no Settings

Para adicionar o componente QRCodeDisplay na página de Settings:

### Localizar settings/Settings.tsx

Encontre a seção onde deseja adicionar o QR code (recomenda-se após "Menu & Items" ou em nova aba).

### Adicionar Código

```tsx
import QRCodeDisplay from '../components/QRCodeDisplay';

// Dentro do componente Settings:
export default function Settings() {
  return (
    <div className="space-y-6">
      {/* ... outras seções ... */}
      
      {/* Seção de QR Code */}
      <div className="mt-8">
        <h2 className="text-2xl font-black mb-4">Menu Online & QR Code</h2>
        <QRCodeDisplay compact={false} showStats={true} />
      </div>
    </div>
  );
}
```

---

## Registar Acessos ao Menu

Para rastrear quando clientes acessam o menu via QR, adicione isto em `PublicMenu.tsx`:

### Modificação em PublicMenu.tsx

```tsx
import { useStore } from '../store/useStore';

export default function PublicMenu() {
  const { logMenuAccess } = useStore();
  const { tableId } = useParams();

  // Registar acesso quando componente monta
  useEffect(() => {
    logMenuAccess({
      type: tableId ? 'TABLE_MENU' : 'PUBLIC_MENU',
      tableId: tableId,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    });
  }, [tableId, logMenuAccess]);

  // ... resto do código
}
```

---

## Configuração de URL Base

### Método 1: Via Environment Variables

Crie um arquivo `.env`:

```env
VITE_RESTAURANT_URL=https://seu-dominio.com
VITE_MENU_PATH=/menu/public
```

Use em `qrMenuService.ts`:

```typescript
const baseUrl = import.meta.env.VITE_RESTAURANT_URL || 'https://seu-dominio.com';
const menuPath = import.meta.env.VITE_MENU_PATH || '/menu/public';
```

### Método 2: Via Store Settings

A URL é guardada em `useStore()` -> `settings.restaurantUrl`

Configure na página Settings.

---

## Instalação de Dependências

```bash
# Obrigatório para QR codes
npm install qrcode.react

# Opcional para PDF
npm install jspdf

# Opcional para QR mais avançado
npm install qr-code-styling
```

---

## Verificação de Integração

Após seguir os passos acima, verifique:

- [ ] Rotas `/qr-menu` e `/qr-analytics` funcionam
- [ ] Botões aparecem na Sidebar
- [ ] Componente QRCodeDisplay aparece no Settings
- [ ] QR code é gerado corretamente
- [ ] Compartilhamento funciona
- [ ] Acessos são registados no Analytics
- [ ] URLs estão corretas

---

## Troubleshooting

### Botões não aparecem na Sidebar
- Verificar se imports estão corretos
- Verifi

car se items array está correto
- Recarregar página

### Componentes não encontram useStore
- Verificar caminho do import
- Garantir que useStore.ts foi modificado com novos métodos

### QR code não escaneia
- Verificar URL gerada
- Testar manualmente abrindo URL
- Verificar se CORS está configurado corretamente

---

## Próximos Passos

1. ✅ Implementar integração básica
2. ⏳ Configurar URL base do restaurante
3. ⏳ Treinar staff
4. ⏳ Imprimir QR codes
5. ⏳ Monitorar acessos em tempo real
6. ⏳ Otimizar baseado em dados

---

**Última atualização:** 2024
**Versão:** 1.0.0
=======
# 🔗 Guia de Integração do QR Code Menu

## Adicionar Rotas ao App.tsx

Localize o arquivo `App.tsx` e adicione as rotas para os novos componentes de QR code.

### Código a Adicionar

```typescript
// Adicione estes imports no topo do App.tsx
import QRMenuManager from './pages/QRMenuManager';
import QRCodeAnalytics from './pages/QRCodeAnalytics';
import QRCodeDisplay from './components/QRCodeDisplay';

// Dentro da definição de rotas, adicione:
<Route path="/qr-menu" element={<QRMenuManager />} />
<Route path="/qr-analytics" element={<QRCodeAnalytics />} />
```

### Exemplo Completo de App.tsx (seção de rotas)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import QRMenuManager from './pages/QRMenuManager';
import QRCodeAnalytics from './pages/QRCodeAnalytics';
import PublicMenu from './pages/PublicMenu';
// ... outros imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Existentes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/menu/public/:tableId?" element={<PublicMenu />} />
        
        {/* Novas Rotas de QR Code */}
        <Route path="/qr-menu" element={<QRMenuManager />} />
        <Route path="/qr-analytics" element={<QRCodeAnalytics />} />
        
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Adicionar Botões de Navegação na Sidebar

Localize o arquivo `components/Sidebar.tsx` e adicione os botões para acessar o QR menu.

### Código a Adicionar

```tsx
// No array de items da sidebar, adicione:
{
  label: 'QR Code Menu',
  icon: QrCode,
  path: '/qr-menu',
  color: '#06b6d4'
},
{
  label: 'Análise QR',
  icon: BarChart3,
  path: '/qr-analytics',
  color: '#f59e0b'
}
```

### Adicionar Imports

```tsx
import { QrCode, BarChart3 } from 'lucide-react';
```

---

## Integrar QR Code Display no Settings

Para adicionar o componente QRCodeDisplay na página de Settings:

### Localizar settings/Settings.tsx

Encontre a seção onde deseja adicionar o QR code (recomenda-se após "Menu & Items" ou em nova aba).

### Adicionar Código

```tsx
import QRCodeDisplay from '../components/QRCodeDisplay';

// Dentro do componente Settings:
export default function Settings() {
  return (
    <div className="space-y-6">
      {/* ... outras seções ... */}
      
      {/* Seção de QR Code */}
      <div className="mt-8">
        <h2 className="text-2xl font-black mb-4">Menu Online & QR Code</h2>
        <QRCodeDisplay compact={false} showStats={true} />
      </div>
    </div>
  );
}
```

---

## Registar Acessos ao Menu

Para rastrear quando clientes acessam o menu via QR, adicione isto em `PublicMenu.tsx`:

### Modificação em PublicMenu.tsx

```tsx
import { useStore } from '../store/useStore';

export default function PublicMenu() {
  const { logMenuAccess } = useStore();
  const { tableId } = useParams();

  // Registar acesso quando componente monta
  useEffect(() => {
    logMenuAccess({
      type: tableId ? 'TABLE_MENU' : 'PUBLIC_MENU',
      tableId: tableId,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    });
  }, [tableId, logMenuAccess]);

  // ... resto do código
}
```

---

## Configuração de URL Base

### Método 1: Via Environment Variables

Crie um arquivo `.env`:

```env
VITE_RESTAURANT_URL=https://seu-dominio.com
VITE_MENU_PATH=/menu/public
```

Use em `qrMenuService.ts`:

```typescript
const baseUrl = import.meta.env.VITE_RESTAURANT_URL || 'https://seu-dominio.com';
const menuPath = import.meta.env.VITE_MENU_PATH || '/menu/public';
```

### Método 2: Via Store Settings

A URL é guardada em `useStore()` -> `settings.restaurantUrl`

Configure na página Settings.

---

## Instalação de Dependências

```bash
# Obrigatório para QR codes
npm install qrcode.react

# Opcional para PDF
npm install jspdf

# Opcional para QR mais avançado
npm install qr-code-styling
```

---

## Verificação de Integração

Após seguir os passos acima, verifique:

- [ ] Rotas `/qr-menu` e `/qr-analytics` funcionam
- [ ] Botões aparecem na Sidebar
- [ ] Componente QRCodeDisplay aparece no Settings
- [ ] QR code é gerado corretamente
- [ ] Compartilhamento funciona
- [ ] Acessos são registados no Analytics
- [ ] URLs estão corretas

---

## Troubleshooting

### Botões não aparecem na Sidebar
- Verificar se imports estão corretos
- Verifi

car se items array está correto
- Recarregar página

### Componentes não encontram useStore
- Verificar caminho do import
- Garantir que useStore.ts foi modificado com novos métodos

### QR code não escaneia
- Verificar URL gerada
- Testar manualmente abrindo URL
- Verificar se CORS está configurado corretamente

---

## Próximos Passos

1. ✅ Implementar integração básica
2. ⏳ Configurar URL base do restaurante
3. ⏳ Treinar staff
4. ⏳ Imprimir QR codes
5. ⏳ Monitorar acessos em tempo real
6. ⏳ Otimizar baseado em dados

---

**Última atualização:** 2024
**Versão:** 1.0.0
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
