# Procedimentos de Manutenção e Recuperação de Dados (DLP)

Este documento descreve os protocolos do sistema de **Data Loss Prevention (DLP)** da aplicação **Tasca do Vereda**.

## 1. Visão Geral do Sistema
O sistema DLP foi projetado para garantir a integridade e persistência dos dados através de quatro pilares:
- **Validação Proativa**: Verificação de dados antes de qualquer operação de escrita.
- **Auditoria Estruturada**: Registro detalhado de todas as operações críticas.
- **Redundância Multi-camada**: Backups locais (RAID 10 simulado) e em nuvem (Supabase).
- **Recuperação Automática**: Watchdog que detecta corrupção e restaura o último estado válido.

## 2. Protocolos de Backup
Os backups são realizados automaticamente em três níveis:
1. **Local (AppData)**: Cópias encriptadas na pasta de dados da aplicação.
2. **Redundância Local (RAID)**: Três cópias espelhadas em diretórios diferentes para prevenir falhas no sistema de arquivos.
3. **Nuvem (Supabase)**: Georeplicação dos dados para o servidor remoto.

**Frequência**: A cada 15 minutos (Automático) ou Manualmente via Painel do Administrador.

## 3. Diagnóstico de Problemas
Se a aplicação apresentar comportamento instável ou perda de dados:
1. **Verificar Logs de Auditoria**: Acesse o painel de logs para identificar falhas de sincronização (`SYNC_FAILED`) ou erros de validação (`DLP_VALIDATION_ERROR`).
2. **Executar Health Check**: Utilize a ferramenta de diagnóstico no menu de desenvolvedor para validar o estado atual da memória vs base de dados.
3. **Status do Supabase**: Verifique se a conexão com a nuvem está ativa e se as credenciais são válidas.

## 4. Protocolo de Restauração
Em caso de perda efetiva de dados:
1. **Restauração Automática**: Ao iniciar, se o sistema detectar corrupção, ele tentará carregar o backup mais recente que passe nos testes de integridade.
2. **Restauração Manual**:
    - Vá para **Configurações > Recuperação de Dados**.
    - Liste os backups disponíveis (Locais e Nuvem).
    - Selecione o ponto de restauração desejado.
    - Confirme a operação (Atenção: Dados atuais não salvos serão perdidos).

## 5. Alertas e Notificações
O sistema emite alertas proativos:
- **CRITICAL**: Falha total no backup, corrupção de dados detectada ou falha na recuperação automática.
- **WARNING**: Falha em uma das camadas de redundância (ex: falha no RAID mas sucesso no Cloud).
- **INFO**: Sucesso em operações de manutenção programada.

---
*Documento atualizado em: 2026-02-07*
*Responsável Técnico: Equipe de Desenvolvimento Tasca do Vereda*
