# Documentação de Atualização - Versão 1.1.61

Este documento descreve as principais alterações e restaurações realizadas no código-fonte para a versão 1.1.61 do sistema Tasca Do VEREDA.

## 1. Integrações Externas
- **IntegrationAPIService**: Implementação de um wrapper REST API para permitir que sistemas terceiros se conectem à aplicação.
- **Módulo de Integrações**: Adicionado ao estado global (Zustand) para gerenciar chaves de API, webhooks e sessões móveis.

## 2. Sistema de Biometria
- **BiometricIntegrationService**: Novo serviço para integração com dispositivos biométricos físicos (ex: ZK-Teco).
- **Sincronização Automática**: Implementação de lógica para processar batidas de ponto e converter em registros de presença (`AttendanceRecord`).
- **Suporte a Dispositivos**: Configuração para dispositivos MB20-VL e outros compatíveis via IP/Porta.

## 3. Dashboard Mobile (Acesso Remoto)
- **MobileDashboard.tsx**: Interface otimizada para dispositivos móveis permitindo que o proprietário acompanhe o negócio remotamente.
- **Sincronização via Firebase**: Utilização do Firebase Firestore para espelhamento de dados em tempo real entre o desktop e o mobile.
- **Segurança Remota**: Autenticação via PIN dedicada para o acesso móvel.

## 4. Segurança e Controle de Acesso
- **RBAC (Role-Based Access Control)**: Refinamento das permissões de usuário em `App.tsx` e `Sidebar.tsx`.
- **Novas Permissões**: Adicionadas permissões específicas para `BIOMETRIC_SYNC`, `QR_MENU_CONFIG`, `MANAGE_EMPLOYEES` e `VIEW_FINANCIAL`.

## 5. Estrutura de Tipos e Interfaces
- **types.ts**: Atualizado para incluir as novas interfaces de `BiometricDevice`, `APIKey`, `WebhookConfig` e extensões de `User` e `Settings`.

## 6. Sincronização MSI
- Garantido que o código-fonte esteja em total conformidade com os requisitos da versão 1.1.61 do instalador MSI.
- Verificação de build (`npm run build`) concluída com sucesso.

---
**Data da Documentação:** 05 de Fevereiro de 2026
**Versão:** 1.1.61
