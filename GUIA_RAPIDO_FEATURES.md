<<<<<<< HEAD
# 🚀 GUIA RÁPIDO - Como Usar as Novas Funcionalidades

## 1️⃣ Acessar o Dashboard Analytics

### Passo a Passo:
```
1. Login com PIN (Usuário ADMIN)
2. Na barra lateral esquerda → "Analytics" (ícone 📈)
3. Escolher período: [7D] [30D] [90D]
4. Navegar entre abas:
   • Vendas → Gráficos de faturamento
   • Menu → Top pratos vendidos
   • Estoque → Status de inventário
   • Equipa → Rating de funcionários
```

### O Que Ver?
- **KPI Cards**: Faturamento, Ticket Médio, Retenção, Total Pedidos
- **Gráficos**: Tendências, distribuição, histórico
- **Alertas Inline**: Stock crítico, pratos ruins, picos
- **Ranking**: Horários com mais movimento, top funcionários

---

## 2️⃣ Usar Smart Recommendations no POS

### Como Funciona:
```
1. Entrar no POS Terminal
2. Selecionar uma mesa
3. Adicionar itens ao pedido
4. No canto inferior direito → botão ✨ (flutuante)
5. Clica ou espera 3 segundos → abre recomendações
```

### Interpretar o Score:
```
🔥 90%+ → "Muito popular agora"
         (Adicione com confiança)

🔗 75%+ → "Frequentemente comprado junto"
         (Cross-sell de alta probabilidade)

📈 50%+ → "Tendência em alta"
         (Oportunidade de venda)

❌ <50% → Não recomendado neste contexto
```

### Adicionar Recomendação:
```
1. Hover sobre o item (mouse)
2. Botão "+ Adicionar" aparece
3. Clica 1x
4. Notificação verde: "Adicionado!"
5. Item aparece no carrinho do pedido
```

---

## 3️⃣ Interpretar Alertas Inteligentes

### Onde Aparecem?
```
Topo direito da tela (sempre visível)
Aparecem automaticamente quando há situações críticas
```

### Tipos de Alerta & Ações:

#### 🔴 CRÍTICO (Vermelho)
```
Título: "2 itens críticos"
Mensagem: "Trigo esgotar-se-á em breve"
Ação: [Ver Estoque] 
→ Clica para ir direto ao Inventory
```

#### 🟠 WARNING (Laranja)
```
Título: "Queda de vendas detectada"
Mensagem: "Vendas caíram 25% vs dia anterior"
Ação: [Analisar]
→ Abre Analytics para investigar
```

#### 🔵 INFO (Azul)
```
Título: "3 pratos não vendidos"
Mensagem: "Considere remover ou repromoçionar"
Ação: [Revisar Menu]
→ Vai para menu editor
```

### Exemplos Reais:

**Cenário 1**: Stock Crítico
```
Manhã: Alert aparece "Pão < 2 dias"
Ação: Staff vai ao Inventory, faz pedido
Resultado: Evita stock-out no almoço
```

**Cenário 2**: Queda de Vendas
```
14:30: Alert "Vendas ↓ 28% vs ontem"
Ação: Manager analisa, vê que Arroz caiu
Resultado: Promove Arroz com 10% desconto
```

**Cenário 3**: Pico de Pedidos
```
13:00: Alert "15 pedidos ativos"
Ação: Chef avisa equipa para preparar
Resultado: Prazos mantidos, clientes felizes
```

---

## 4️⃣ Sistema de Fidelização (Loyalty)

### Como Funciona:
```
1. Cliente faz pedido
2. Usa cartão/CPF (Clientes module)
3. Finaliza pagamento
4. Sistema AUTOMATICAMENTE:
   • Adiciona pontos (1 ponto = 1 AOA gasto)
   • Atualiza tier (BRONZE → SILVER → GOLD → PLATINUM)
   • Calcula desconto

5. Na próxima compra:
   • Se SILVER (≥1000 pts) → 5% desconto
   • Se GOLD (≥2500 pts) → 10% desconto
   • Se PLATINUM (≥5000 pts) → 15% desconto
```

### Ver Status do Cliente:
```
1. Módulo "Clientes" (sidebar)
2. Procurar cliente
3. Ver campos:
   • Points: 2.350 (GOLD)
   • Tier: GOLD ⭐
   • Visits: 12
   • LastVisit: 3 dias atrás
4. Desconto: 10% automático na próxima compra
```

### Exemplos:

**Cliente Bronze**:
```
Compra: 50.000 AOA
Desconto: 0%
Pontos: +50 (total: 500)
Tier: BRONZE (< 1000 pontos)
```

**Cliente Gold**:
```
Compra: 50.000 AOA
Desconto: 10% (-5.000) = 45.000 AOA
Pontos: +45 (total: 2.500+)
Tier: GOLD (1000-2500 pontos)
```

**Cliente Platinum**:
```
Compra: 50.000 AOA
Desconto: 15% (-7.500) = 42.500 AOA
Pontos: +42 (total: 5.000+)
Tier: PLATINUM (5000+ pontos)
```

---

## 5️⃣ Métricas Específicas - O Que Significam?

### Faturamento Total
```
Soma de todos os pedidos fechados no período
Útil para: Ver tendências, comparar períodos
Ação: Se ↓ 20%, investigar via alerts
```

### Ticket Médio
```
Faturamento ÷ Número de Pedidos
Útil para: Entender tamanho médio de venda
Ação: Aumentar com upsell (recomendações)
```

### Retenção (%)
```
(Clientes que repetem ÷ Total clientes) × 100
Útil para: Medir loyalty program
Ação: <50% = melhorar recomendações
```

### Pratos - Trend
```
📈 UP = vendendo mais que semana anterior
→ Aumentar estoque, destacar no menu
→ Aumentar preço (demanda alta)

➡️ STABLE = vendas consistentes
→ Manter preço, manter estoque

📉 DOWN = vendendo menos
→ Remover do menu OU promover
→ Reduzir preço para estimular venda
```

### Estoque - Dias até Esgotamento
```
Quantidade ÷ (Uso diário médio)
Exemplo: 100 unidades ÷ 5/dia = 20 dias

Verde (>7 dias): OK, sem ação
Amarelo (3-7 dias): Avisar
Vermelho (<3 dias): CRÍTICO, pedir urgente
```

### Performance de Funcionários
```
Rating (1-5 ⭐):
⭐⭐⭐⭐⭐ = Excelente (4.5+)
⭐⭐⭐⭐  = Bom (3.5-4.5)
⭐⭐⭐   = Normal (2.5-3.5)

Eficiência (%):
= (Dias presentes ÷ Dias úteis) × 100
90%+ = Excelente
70-90% = Bom
<70% = Necessita melhoria
```

---

## 6️⃣ Casos de Uso Práticos

### Cenário 1: Gerenciar Cardápio
```
PROBLEMA: Alguns pratos não vendem
SOLUÇÃO:
1. Abrir Analytics → Menu
2. Ver "Distribuição de Vendas"
3. Pratos com 0 vendas:
   • Remover do menu OU
   • Repromoçionar (desconto)
   • Mudar posição/nome no menu
4. Resultado: Aumentar variedade de venda
```

### Cenário 2: Otimizar Horários
```
PROBLEMA: Falta de staff em horários pico
SOLUÇÃO:
1. Abrir Analytics → Vendas
2. Ver "Horários de Pico"
3. Ver que 13:00-14:30 é mais move
4. Ajustar escalas (Schedules) para:
   • Mais cozinheiros às 12:30
   • Mais garçons às 13:00
5. Resultado: Melhor atendimento, clientes mais felizes
```

### Cenário 3: Fidelizar Cliente VIP
```
PROBLEMA: Cliente bom, mas acha caro
SOLUÇÃO:
1. Cliente chega com 4.500 pontos (GOLD)
2. Sistema automaticamente:
   • Calcula 10% desconto
   • Aplica sem ele pedir
3. Cliente vê: "50.000 → 45.000 AOA"
4. Resultado: Cliente volta mais (loyalty)
```

### Cenário 4: Evitar Stock-Out
```
PROBLEMA: Ficou sem Pão no almoço
SOLUÇÃO:
1. Alert: "Pão < 2 dias" (🔴)
2. Clica [Ver Estoque]
3. Vê: 5 unidades, uso 7/dia = 0,7 dias
4. Clica [Pedir Recompra]
5. Próximo dia: +50 unidades entregues
6. Resultado: Nunca mais ficou sem Pão
```

---

## 7️⃣ Troubleshooting

### Alert não aparece?
```
✓ Conferir se dados estão sendo salvos
✓ Fechar/abrir aplicação
✓ Limpar cache (localStorage)
✓ Verificar console (F12)
```

### Recomendação não aparece?
```
✓ Precisa ter histórico de pedidos (mínimo 10)
✓ Item não pode estar já no carrinho
✓ Botão ✨ flutuante no POS (canto inferior direito)
✓ Hover para ver botão "+ Adicionar"
```

### Loyaltypoints não aumentam?
```
✓ Cliente precisa estar registrado (Clientes module)
✓ Pedido precisa estar FECHADO (pagamento)
✓ Recarregar página (F5)
✓ Verificar em Clientes se pontos aumentaram
```

### Dashboard vazio?
```
✓ Precisão ter pedidos fechados no período
✓ Mudar filtro de período (30D ao invés de 7D)
✓ Conferir data do sistema
✓ Limpar browser cache
```

---

## 8️⃣ Tips & Tricks

### 💡 Maximizar Recomendações
```
✓ Criar padrões nos pedidos
  Exemplo: Arroz sempre com Frango
✓ Sistema aprende automaticamente
✓ Quanto mais pedidos, melhor o algoritmo
✓ Após 100 pedidos = recomendações muito precisas
```

### 💡 Usar Alertas como KPI
```
✓ Contar quantos alertas CRÍTICOS surgem
✓ Reduzir com melhor planejamento
✓ Alerta = oportunidade de melhoria
✓ 0 alertas críticos = operação otimizada
```

### 💡 Fidelizar com Propósito
```
✓ Não descontar para todos
✓ Apenas para GOLD/PLATINUM (tiers reais)
✓ Mantém margem, premia lealdade
✓ Clientes sentem-se valorizados
```

### 💡 Analytics como Ferramenta
```
✓ Executar 1x semana (segunda-feira)
✓ Identificar 1 problema = 1 ação
✓ Monitorar resultado 1 semana depois
✓ Documentar mudanças (o que funcionou)
```

---

## 🎯 Checklist de Adoção

- [ ] Logar em Analytics (menu)
- [ ] Ver Dashboard Analytics (explorar 4 abas)
- [ ] Entender KPI Cards
- [ ] Usar POS com Recomendações
- [ ] Receber e agir num Alert
- [ ] Ver cliente com pontos de loyalty
- [ ] Aplicar desconto automático
- [ ] Documentar 1 insight
- [ ] Treinar staff sobre features
- [ ] Monitorar resultados (1 semana)

---

## 📊 Métrica de Sucesso

```
Semana 1: Exploração (familiarização)
Semana 2-3: Adoção (usar features diárias)
Semana 4: Otimização (ajustar processos)
Mês 2+: Impacto (ver +25% lucro estimado)
```

---

## 📞 Dúvidas?

Consulte:
- **IMPLEMENTACAO_COMPLETA.md** - Visão técnica
- **OTIMIZACOES_E_FEATURES.md** - Features detalhadas
- **SUMARIO_IMPLEMENTACAO.md** - Overview visual
- Este arquivo - Guia prático

**Status**: ✅ Pronto para usar!

---

**Data**: 27 January 2026
**Versão**: 2.0
**Aplicação**: Tasca Do VEREDA
=======
# 🚀 GUIA RÁPIDO - Como Usar as Novas Funcionalidades

## 1️⃣ Acessar o Dashboard Analytics

### Passo a Passo:
```
1. Login com PIN (Usuário ADMIN)
2. Na barra lateral esquerda → "Analytics" (ícone 📈)
3. Escolher período: [7D] [30D] [90D]
4. Navegar entre abas:
   • Vendas → Gráficos de faturamento
   • Menu → Top pratos vendidos
   • Estoque → Status de inventário
   • Equipa → Rating de funcionários
```

### O Que Ver?
- **KPI Cards**: Faturamento, Ticket Médio, Retenção, Total Pedidos
- **Gráficos**: Tendências, distribuição, histórico
- **Alertas Inline**: Stock crítico, pratos ruins, picos
- **Ranking**: Horários com mais movimento, top funcionários

---

## 2️⃣ Usar Smart Recommendations no POS

### Como Funciona:
```
1. Entrar no POS Terminal
2. Selecionar uma mesa
3. Adicionar itens ao pedido
4. No canto inferior direito → botão ✨ (flutuante)
5. Clica ou espera 3 segundos → abre recomendações
```

### Interpretar o Score:
```
🔥 90%+ → "Muito popular agora"
         (Adicione com confiança)

🔗 75%+ → "Frequentemente comprado junto"
         (Cross-sell de alta probabilidade)

📈 50%+ → "Tendência em alta"
         (Oportunidade de venda)

❌ <50% → Não recomendado neste contexto
```

### Adicionar Recomendação:
```
1. Hover sobre o item (mouse)
2. Botão "+ Adicionar" aparece
3. Clica 1x
4. Notificação verde: "Adicionado!"
5. Item aparece no carrinho do pedido
```

---

## 3️⃣ Interpretar Alertas Inteligentes

### Onde Aparecem?
```
Topo direito da tela (sempre visível)
Aparecem automaticamente quando há situações críticas
```

### Tipos de Alerta & Ações:

#### 🔴 CRÍTICO (Vermelho)
```
Título: "2 itens críticos"
Mensagem: "Trigo esgotar-se-á em breve"
Ação: [Ver Estoque] 
→ Clica para ir direto ao Inventory
```

#### 🟠 WARNING (Laranja)
```
Título: "Queda de vendas detectada"
Mensagem: "Vendas caíram 25% vs dia anterior"
Ação: [Analisar]
→ Abre Analytics para investigar
```

#### 🔵 INFO (Azul)
```
Título: "3 pratos não vendidos"
Mensagem: "Considere remover ou repromoçionar"
Ação: [Revisar Menu]
→ Vai para menu editor
```

### Exemplos Reais:

**Cenário 1**: Stock Crítico
```
Manhã: Alert aparece "Pão < 2 dias"
Ação: Staff vai ao Inventory, faz pedido
Resultado: Evita stock-out no almoço
```

**Cenário 2**: Queda de Vendas
```
14:30: Alert "Vendas ↓ 28% vs ontem"
Ação: Manager analisa, vê que Arroz caiu
Resultado: Promove Arroz com 10% desconto
```

**Cenário 3**: Pico de Pedidos
```
13:00: Alert "15 pedidos ativos"
Ação: Chef avisa equipa para preparar
Resultado: Prazos mantidos, clientes felizes
```

---

## 4️⃣ Sistema de Fidelização (Loyalty)

### Como Funciona:
```
1. Cliente faz pedido
2. Usa cartão/CPF (Clientes module)
3. Finaliza pagamento
4. Sistema AUTOMATICAMENTE:
   • Adiciona pontos (1 ponto = 1 AOA gasto)
   • Atualiza tier (BRONZE → SILVER → GOLD → PLATINUM)
   • Calcula desconto

5. Na próxima compra:
   • Se SILVER (≥1000 pts) → 5% desconto
   • Se GOLD (≥2500 pts) → 10% desconto
   • Se PLATINUM (≥5000 pts) → 15% desconto
```

### Ver Status do Cliente:
```
1. Módulo "Clientes" (sidebar)
2. Procurar cliente
3. Ver campos:
   • Points: 2.350 (GOLD)
   • Tier: GOLD ⭐
   • Visits: 12
   • LastVisit: 3 dias atrás
4. Desconto: 10% automático na próxima compra
```

### Exemplos:

**Cliente Bronze**:
```
Compra: 50.000 AOA
Desconto: 0%
Pontos: +50 (total: 500)
Tier: BRONZE (< 1000 pontos)
```

**Cliente Gold**:
```
Compra: 50.000 AOA
Desconto: 10% (-5.000) = 45.000 AOA
Pontos: +45 (total: 2.500+)
Tier: GOLD (1000-2500 pontos)
```

**Cliente Platinum**:
```
Compra: 50.000 AOA
Desconto: 15% (-7.500) = 42.500 AOA
Pontos: +42 (total: 5.000+)
Tier: PLATINUM (5000+ pontos)
```

---

## 5️⃣ Métricas Específicas - O Que Significam?

### Faturamento Total
```
Soma de todos os pedidos fechados no período
Útil para: Ver tendências, comparar períodos
Ação: Se ↓ 20%, investigar via alerts
```

### Ticket Médio
```
Faturamento ÷ Número de Pedidos
Útil para: Entender tamanho médio de venda
Ação: Aumentar com upsell (recomendações)
```

### Retenção (%)
```
(Clientes que repetem ÷ Total clientes) × 100
Útil para: Medir loyalty program
Ação: <50% = melhorar recomendações
```

### Pratos - Trend
```
📈 UP = vendendo mais que semana anterior
→ Aumentar estoque, destacar no menu
→ Aumentar preço (demanda alta)

➡️ STABLE = vendas consistentes
→ Manter preço, manter estoque

📉 DOWN = vendendo menos
→ Remover do menu OU promover
→ Reduzir preço para estimular venda
```

### Estoque - Dias até Esgotamento
```
Quantidade ÷ (Uso diário médio)
Exemplo: 100 unidades ÷ 5/dia = 20 dias

Verde (>7 dias): OK, sem ação
Amarelo (3-7 dias): Avisar
Vermelho (<3 dias): CRÍTICO, pedir urgente
```

### Performance de Funcionários
```
Rating (1-5 ⭐):
⭐⭐⭐⭐⭐ = Excelente (4.5+)
⭐⭐⭐⭐  = Bom (3.5-4.5)
⭐⭐⭐   = Normal (2.5-3.5)

Eficiência (%):
= (Dias presentes ÷ Dias úteis) × 100
90%+ = Excelente
70-90% = Bom
<70% = Necessita melhoria
```

---

## 6️⃣ Casos de Uso Práticos

### Cenário 1: Gerenciar Cardápio
```
PROBLEMA: Alguns pratos não vendem
SOLUÇÃO:
1. Abrir Analytics → Menu
2. Ver "Distribuição de Vendas"
3. Pratos com 0 vendas:
   • Remover do menu OU
   • Repromoçionar (desconto)
   • Mudar posição/nome no menu
4. Resultado: Aumentar variedade de venda
```

### Cenário 2: Otimizar Horários
```
PROBLEMA: Falta de staff em horários pico
SOLUÇÃO:
1. Abrir Analytics → Vendas
2. Ver "Horários de Pico"
3. Ver que 13:00-14:30 é mais move
4. Ajustar escalas (Schedules) para:
   • Mais cozinheiros às 12:30
   • Mais garçons às 13:00
5. Resultado: Melhor atendimento, clientes mais felizes
```

### Cenário 3: Fidelizar Cliente VIP
```
PROBLEMA: Cliente bom, mas acha caro
SOLUÇÃO:
1. Cliente chega com 4.500 pontos (GOLD)
2. Sistema automaticamente:
   • Calcula 10% desconto
   • Aplica sem ele pedir
3. Cliente vê: "50.000 → 45.000 AOA"
4. Resultado: Cliente volta mais (loyalty)
```

### Cenário 4: Evitar Stock-Out
```
PROBLEMA: Ficou sem Pão no almoço
SOLUÇÃO:
1. Alert: "Pão < 2 dias" (🔴)
2. Clica [Ver Estoque]
3. Vê: 5 unidades, uso 7/dia = 0,7 dias
4. Clica [Pedir Recompra]
5. Próximo dia: +50 unidades entregues
6. Resultado: Nunca mais ficou sem Pão
```

---

## 7️⃣ Troubleshooting

### Alert não aparece?
```
✓ Conferir se dados estão sendo salvos
✓ Fechar/abrir aplicação
✓ Limpar cache (localStorage)
✓ Verificar console (F12)
```

### Recomendação não aparece?
```
✓ Precisa ter histórico de pedidos (mínimo 10)
✓ Item não pode estar já no carrinho
✓ Botão ✨ flutuante no POS (canto inferior direito)
✓ Hover para ver botão "+ Adicionar"
```

### Loyaltypoints não aumentam?
```
✓ Cliente precisa estar registrado (Clientes module)
✓ Pedido precisa estar FECHADO (pagamento)
✓ Recarregar página (F5)
✓ Verificar em Clientes se pontos aumentaram
```

### Dashboard vazio?
```
✓ Precisão ter pedidos fechados no período
✓ Mudar filtro de período (30D ao invés de 7D)
✓ Conferir data do sistema
✓ Limpar browser cache
```

---

## 8️⃣ Tips & Tricks

### 💡 Maximizar Recomendações
```
✓ Criar padrões nos pedidos
  Exemplo: Arroz sempre com Frango
✓ Sistema aprende automaticamente
✓ Quanto mais pedidos, melhor o algoritmo
✓ Após 100 pedidos = recomendações muito precisas
```

### 💡 Usar Alertas como KPI
```
✓ Contar quantos alertas CRÍTICOS surgem
✓ Reduzir com melhor planejamento
✓ Alerta = oportunidade de melhoria
✓ 0 alertas críticos = operação otimizada
```

### 💡 Fidelizar com Propósito
```
✓ Não descontar para todos
✓ Apenas para GOLD/PLATINUM (tiers reais)
✓ Mantém margem, premia lealdade
✓ Clientes sentem-se valorizados
```

### 💡 Analytics como Ferramenta
```
✓ Executar 1x semana (segunda-feira)
✓ Identificar 1 problema = 1 ação
✓ Monitorar resultado 1 semana depois
✓ Documentar mudanças (o que funcionou)
```

---

## 🎯 Checklist de Adoção

- [ ] Logar em Analytics (menu)
- [ ] Ver Dashboard Analytics (explorar 4 abas)
- [ ] Entender KPI Cards
- [ ] Usar POS com Recomendações
- [ ] Receber e agir num Alert
- [ ] Ver cliente com pontos de loyalty
- [ ] Aplicar desconto automático
- [ ] Documentar 1 insight
- [ ] Treinar staff sobre features
- [ ] Monitorar resultados (1 semana)

---

## 📊 Métrica de Sucesso

```
Semana 1: Exploração (familiarização)
Semana 2-3: Adoção (usar features diárias)
Semana 4: Otimização (ajustar processos)
Mês 2+: Impacto (ver +25% lucro estimado)
```

---

## 📞 Dúvidas?

Consulte:
- **IMPLEMENTACAO_COMPLETA.md** - Visão técnica
- **OTIMIZACOES_E_FEATURES.md** - Features detalhadas
- **SUMARIO_IMPLEMENTACAO.md** - Overview visual
- Este arquivo - Guia prático

**Status**: ✅ Pronto para usar!

---

**Data**: 27 January 2026
**Versão**: 2.0
**Aplicação**: Tasca Do VEREDA
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
