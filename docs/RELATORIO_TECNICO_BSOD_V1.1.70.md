# Relatório Técnico: Investigação de BSOD e Erro "IIS" (v1.1.70)

## 1. Diagnóstico do Problema
O erro apresentado na imagem (tela azul com logo "IIS" centralizado) **não é uma tela azul do Windows (BSOD)** convencional. Trata-se de um erro de roteamento do WebView2/Tauri onde:
1. O aplicativo tentou carregar uma URL interna (`localhost:5173`) que falhou ou foi redirecionada.
2. O servidor local (provavelmente o IIS do Windows que estava ativo na máquina) respondeu na porta 80 ou 443, ou o script de redirecionamento no `index.html` tentou levar o app para uma rota externa inexistente.
3. O logo "IIS" confirma que a requisição saiu do contexto do aplicativo e bateu no Servidor de Internet do Windows.

## 2. Ações Corretivas Aplicadas

### A. Correção de Redirecionamento Crítico
No arquivo [index.html](file:///c:/Users/hneto/tasca-do-vereda---gestão_msi_vscode/index.html), identifiquei scripts que forçavam o redirecionamento de rotas. Estes scripts foram modificados para detectar o ambiente Tauri e **impedir qualquer redirecionamento automático** quando o app está rodando como executável Windows.
- **Antes**: Redirecionava qualquer rota sem `#` para uma nova URL.
- **Depois**: Bloqueia redirecionamentos se `window.__TAURI_INTERNALS__` estiver presente.

### B. Isolamento do WebView2
No [tauri.conf.json](file:///c:/Users/hneto/tasca-do-vereda---gestão_msi_vscode/src-tauri/tauri.conf.json), aplicamos:
- `RendererCodeIntegrity` desativado: Evita conflitos com antivírus que causam crashes no processo do browser.
- Novo `dataDirectory`: `stable-v1.1.70-fixed` garante que cache corrompido de versões anteriores não interfira.
- `devtools`: Ativado temporariamente para permitir inspeção remota (F12) se necessário durante os testes.

## 3. Guia de Troubleshooting e Monitoramento (Ambiente do Cliente)

### Passo 1: Limpeza de Conflitos
- Desativar o IIS se não for necessário: `Stop-Service W3SVC` no PowerShell.
- Garantir que a porta `5173` não esteja sendo usada por outro serviço.

### Passo 2: Verificação de Drivers (BSOD Real)
Se ocorrer uma tela azul real (que reinicia o PC):
1. Verificar `C:\Windows\Minidump`.
2. Usar o comando `Get-EventLog -LogName System -Newest 50 | Where-Object {$_.EntryType -eq 'Error'}` para listar falhas de hardware recentes.

### Passo 3: Teste de Estabilidade
- O aplicativo deve ser mantido aberto por 48 horas.
- Monitorar o consumo de memória (Private Bytes) via Gerenciador de Tarefas.

## 4. Recomendações de Prevenção
- **Monitoramento**: Implementar o `healthMonitorService` para enviar logs de crash diretamente para o Supabase.
- **Rollback**: Manter sempre a versão `1.1.68` disponível como fallback imediato.
- **Isolamento**: O uso de `--disable-gpu` é mandatório em máquinas de PDV com drivers antigos.

---
**Status**: Implementado e pronto para Build.
