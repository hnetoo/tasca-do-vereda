# Correção: Visibilidade de Imagens no Menu Digital

## Objetivo
Garantir que imagens dos pratos são exibidas apenas quando apropriado, substituindo por um placeholder quando inválidas, ausentes ou falham ao carregar.

## Problema
- Imagens permaneciam visíveis mesmo quando a fonte era inválida ou deveria estar oculta.
- Ocorrências em mudanças de categoria, dados incompletos e links quebrados.

## Solução
- Validação de URLs com `isValidImageUrl(src)` para permitir apenas `http(s)`, `data:image/*` e caminhos absolutos (`/`).
- Tratamento de erro de carregamento com `onError` e mapa `imageErrorMap` para ocultar imagens problemáticas.
- Placeholder visível com texto “Sem imagem” mantendo layout e transições.

## Alterações Principais
- pages/PublicMenu.tsx:
  - Exportado `isValidImageUrl`.
  - Substituída renderização direta de `<img>` por renderização condicional com fallback.
  - Aplicado mesmo padrão no modal de detalhes.
- Testes:
  - pages/PublicMenu.test.tsx valida cenários de URL.

## Testes
- Unitários (Vitest): validação de URL para múltiplos esquemas.
- Execução: `npx vitest run --reporter=dot`.

## Considerações de UI/UX
- Placeholder preserva dimensões e efeitos `hover`.
- Sem impacto nas transições CSS existentes.

## Manutenção
- Para novas fontes de imagem (ex.: CDN interna), ajustar `isValidImageUrl`.
- Monitorar integrações de dados para garantir `dish.image` com formatos suportados.

