# Sistema de Entregas Revolucionário (v2.0)

## Visão Geral
Este documento descreve a implementação do novo sistema de entregas ("Encomendas"), focado em UX minimalista, Inteligência Artificial e visualização em tempo real.

## Funcionalidades Principais

### 1. Dashboard Interativo
- **Mapa 3D**: Visualização em perspectiva com marcadores animados para entregas ativas.
- **KPIs em Tempo Real**: Métricas de entregas ativas, receita, tempo médio e total de pedidos.
- **Lista de Pedidos Ativos**: Interface limpa com status e ações rápidas.

### 2. Criação de Encomendas (Drag & Drop)
- **Modal Inteligente**: Permite arrastar pratos do menu diretamente para a área de pedido.
- **Sugestões via IA**: Baseado no cliente selecionado, o sistema sugere 3 pratos (simulado).
- **Feedback Visual**: Animações de drop e cálculo automático de totais.

### 3. Analytics & IA
- **Previsão de Demanda**: Gráfico comparativo (Real vs Previsto) utilizando dados históricos simulados.
- **Otimização de Rotas**: Funcionalidade para recalcular rotas de entregadores (Mock).

### 4. Experiência do Usuário (UX)
- **Modo "Uma Mão"**: Move o cabeçalho para a parte inferior da tela para facilitar o uso em dispositivos móveis.
- **Tema Automático**: Alterna entre Claro/Escuro baseado no horário (18h-07h = Escuro).
- **Realidade Aumentada (AR)**: Overlay visual simulando câmera para localizar entregas.

## Detalhes Técnicos

### Arquitetura
- **Componente**: `pages/Encomendas.tsx`
- **Estado**: Gerenciado via `useState` local e `useStore` global.
- **Visualização**: `recharts` para gráficos, CSS puro para animações 3D.

### Animações
- Utiliza classes utilitárias `animate-in`, `fade-in`, `slide-in-*` definidas em `index.css`.
- Assegura transições suaves (60fps target) para sensação de app nativo.

### Dependências
- `lucide-react`: Ícones vetoriais.
- `recharts`: Visualização de dados.
- `tailwindcss`: Estilização.

## Manutenção
- **Adicionar Novos Gráficos**: Inserir no bloco `viewMode === 'ANALYTICS'`.
- **Ajustar IA**: Modificar objeto `AIService` no topo do arquivo.
- **Temas**: Cores definidas via classes condicionais `theme === 'dark' ? ... : ...`.
