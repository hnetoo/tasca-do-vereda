# Changelog v1.1.68

## Alterações principais
- Sincronização de versão para 1.1.68 em package, Tauri e Cargo.
- Atualização do painel mobile para eventos em tempo real via SSE.
- Ajustes no script de validação do Supabase para cobrir webhooks.
- Configuração de cobertura no Vitest com limites ajustados.
- Normalização do CSS base para evitar falhas no build do Tailwind.
- Correção de conflito no script de build Tauri para Windows.

## Componentes e serviços afetados
- pages/MobileDashboard.tsx
- scripts/validate_supabase.js
- src-tauri/tauri.conf.json
- src-tauri/Cargo.toml
- vite.config.ts
- build-tauri.ps1
- index.css
