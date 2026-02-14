# Resumo da Atualização v1.1.57

## Melhorias Implementadas:
1. **Sistema de Sincronização Híbrida**: 
   - Integração do Firebase com fallback automático para um **Feed JSON** (`menu_feed.json`).
   - Garante que o menu digital funcione mesmo se o Firebase estiver inacessível.
2. **Refatoração Completa de Categorias**:
   - Implementação de um **CategoryResolver** para mapeamento robusto por ID, nome e slug.
   - Validação rigorosa no `useStore` para impedir que produtos sejam movidos incorretamente para "Bebidas".
   - Ciclo de reparo automático na inicialização para corrigir dados corrompidos.
3. **Logs de Auditoria e Integridade**:
   - Adicionados logs detalhados para rastrear mudanças de categorias e sincronizações.
4. **Interface Administrativa**:
   - Novos botões no Inventário: "Sincronizar Cloud", "Exportar Menu JSON" e "Publicar Menu (Híbrido)".
5. **Logo do Menu Digital**:
   - O logo oficial foi integrado ao cabeçalho do menu QR/Digital.

## Binários Gerados:
- **MSI**: `src-tauri\target\release\bundle\msi\Tasca Do VEREDA_1.1.57_x64_en-US.msi`
- **NSIS**: `src-tauri\target\release\bundle\nsis\Tasca Do VEREDA_1.1.57_x64-setup.exe`
