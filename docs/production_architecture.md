# Arquitetura de Produção - Tasca do Vereda

Esta documentação descreve os componentes de infraestrutura e segurança implementados para garantir a escalabilidade e confiabilidade do sistema, especialmente para o Owner Dashboard.

## 1. Banco de Dados (Supabase/PostgreSQL)

### Otimização de Performance
- **Índices**: Criados índices compostos para tabelas de alta volumetria (`revenues`, `expenses`, `attendance_records`) focados em filtros de data e agregação.
- **Particionamento**: Estratégia de particionamento mensal recomendada para `revenues` e `expenses` caso o volume ultrapasse 1 milhão de registros/ano.

### Consistência de Dados
- **Triggers**: Implementado trigger `update_dashboard_summary` que mantém a tabela `dashboard_summary` sincronizada em tempo real com as transações financeiras, evitando cálculos pesados de `SUM()` no frontend.
- **Audit Logs**: Tabela de auditoria para rastrear alterações críticas em tabelas sensíveis (regras RLS aplicadas para acesso exclusivo do owner).

## 2. Segurança (Row Level Security)

### Políticas de Acesso
- **Owner Dashboard**: Acesso restrito via `auth.jwt() ->> 'role' = 'owner'`.
- **Menu Digital**: Acesso público (anon) limitado estritamente a `categories` (ativas) e `menu_items` (disponíveis).
- **Audit**: Todas as tabelas críticas possuem RLS habilitado e `FORCE ROW LEVEL SECURITY`.

## 3. Camada de Integração (Edge Functions)

### SSE (Server-Sent Events)
A função `owner-events` fornece um stream de eventos em tempo real para o dashboard do proprietário, consolidando mudanças no banco de dados e notificações do sistema em uma única conexão persistente.

### Rate Limiting
- Implementado na camada de Edge Functions para proteger o banco de dados contra abusos.
- **Limites Atuais**: 50 requisições/minuto por IP (ajustável no `index.ts` da função).

## 4. Resiliência no Frontend

### SupabaseService
- **Circuit Breaker**: Interrompe chamadas ao banco se detectar falhas consecutivas, prevenindo cascata de erros.
- **Health Metrics**: Monitoramento de latência e taxa de erro em tempo real.
- **Cache**: Implementado cache com TTL para consultas frequentes e estáticas (ex: configurações do restaurante).

## 5. Próximos Passos Recomendados
1. **Redis para Rate Limiting Global**: Substituir o mapa em memória da Edge Function por Upstash Redis para consistência entre instâncias.
2. **Backups Externos**: Configurar exportação semanal de logs de auditoria para armazenamento frio (S3/GCS).
3. **Monitoramento**: Integrar logs das Edge Functions com ferramentas como Sentry ou Logflare.
