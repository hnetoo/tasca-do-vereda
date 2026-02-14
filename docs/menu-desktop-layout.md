# Layout Desktop do Menu Digital

## Objetivo
Reformular a grelha de produtos para desktop, com modos alternativos de visualização e tipografia/spacing otimizados.

## Funcionalidades Implementadas

### 1. Modos de Visualização
- **Grid (Padrão)**: Visualização rica com imagens grandes (aspect ratio 4:3).
- **Colunas**: Layout estilo Pinterest/Masonry (simulado) para leitura vertical rápida.
- **Lista**: Visualização compacta com miniaturas 64x64px, ideal para pedidos rápidos.

### 2. Responsividade e Breakpoints
O sistema calcula dinamicamente o número de colunas baseado na largura da janela (`window.innerWidth`).

#### Modo Grid (Alta Densidade)
- **>= 1920px**: 6 Colunas (Otimizado para Full HD/4K)
- **>= 1600px**: 5 Colunas
- **>= 1280px**: 4 Colunas (Cobre laptops 1366x768 e 1440x900)
- **>= 1024px**: 3 Colunas (Tablets landscape / Laptops pequenos)
- **>= 640px**: 2 Colunas (Tablets portrait)
- **< 640px**: 1 Coluna (Mobile)

#### Modo Colunas
- **>= 1800px**: 4 Colunas
- **>= 1400px**: 3 Colunas
- **>= 768px**: 2 Colunas
- **< 768px**: 1 Coluna

### 3. Correções de Layout
- **Menu de Categorias**:
  - Botões de visualização (Grid/Lista) foram separados do container de scroll horizontal das categorias.
  - Removido efeito de `scale` no botão ativo que causava deslocamento visual dos itens adjacentes.
  - Adicionado `min-w-0` para prevenir quebras de layout flexbox.
- **Tamanho dos Cards**:
  - Ajustado para 4 colunas em 1366px (anteriormente 3), reduzindo o tamanho excessivo dos cards.
  - Imagens agora mantêm proporção 4:3 consistente.

## Métricas
- Ocupação de tela: Otimizada para mostrar mais produtos "above the fold".
- Em 1366x768, agora exibe 4 produtos por linha (vs 2 ou 3 anteriormente).
- Facilidade de navegação: Scroll horizontal de categorias isolado dos controles de vista.

## Compatibilidade
- Chrome, Firefox, Safari, Edge.
- Fallbacks para imagens inválidas ou erros de carregamento (ORB/CORS).
