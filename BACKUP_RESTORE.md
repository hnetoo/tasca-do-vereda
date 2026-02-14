# Documentação do Processo de Backup e Restauro (V3)

Esta documentação descreve o sistema de backup e restauração do "Tasca do Vereda", incluindo validações de integridade, limpeza de dados legados e estrutura do banco de dados.

## 1. Visão Geral

O sistema utiliza uma abordagem de dupla camada para persistência de dados:
1.  **Zustand Persist (Local Storage)**: Para persistência rápida de estado (Sessão atual).
2.  **Backup Service (Customizado)**: Para backups robustos, versionados e recuperáveis.
3.  **SQL Database (SQLite)**: Para armazenamento estruturado e relacional de longo prazo.

## 2. Estrutura do Backup (V3)

A partir da versão 1.1.59, utilizamos chaves de backup com prefixo `v3_user_only` para isolar dados do utilizador de dados legados ou de exemplo.

### Chaves de Armazenamento
- `v3_user_only_menu_backup`: Contém a lista de produtos (`menu`).
- `v3_user_only_categories_backup`: Contém a lista de categorias (`categories`).
- `v3_user_only_stock_backup`: Contém o inventário (`stock`).

### Formato dos Dados
Os dados são armazenados como strings JSON comprimidas ou puras.
Exemplo de Categoria com Ordenação (Novo na v1.1.60):
```json
{
  "id": "cat_123",
  "name": "Grelhados",
  "icon": "Pizza",
  "sort_order": 1,
  "deletedAt": null
}
```

## 3. Processo de Restauro (Restore)

O processo de restauro é crítico para garantir que dados antigos ou corrompidos não se misturem com dados novos.

### Fluxo de Execução
1.  **Limpeza Segura (Wipe)**:
    - O sistema invoca `databaseOperations.recreateMenuSchema()`.
    - Executa `DROP TABLE` para `dishes` e `menu_categories`.
    - Recria as tabelas com o schema correto (incluindo `sort_order` e constraints `FOREIGN KEY`).
    
2.  **Carregamento do Backup**:
    - Lê o backup mais recente do Local Storage (`v3_user_only_*`).
    - Valida se o JSON é válido.

3.  **Resolução de Categorias**:
    - Verifica integridade de cada categoria.
    - Se uma categoria tiver `sort_order` indefinido, atribui um valor sequencial.

4.  **Resolução de Produtos**:
    - Itera sobre cada produto do backup.
    - Verifica se `categoryId` corresponde a uma categoria existente no backup restaurado.
    - **Regra Crítica**: Se a categoria não existir, o produto é marcado como `uncategorized` (Sem Categoria).
    - **Prevenção de Erros**: Nunca faz fallback automático para "Bebidas" ou outras categorias padrão.

5.  **Persistência**:
    - Salva os dados limpos e validados no Store (Zustand).
    - Dispara sincronização para a Cloud (Firebase) se configurado.

## 4. Banco de Dados SQL

O schema SQL garante a integridade relacional.

### Tabela `menu_categories`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | Identificador único |
| `name` | TEXT | Nome da categoria |
| `icon` | TEXT | Nome do ícone (Lucide) |
| `sort_order` | INTEGER | Ordem de exibição (Novo) |
| `is_active` | BOOLEAN | Status |

### Tabela `dishes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | Identificador único |
| `name` | TEXT | Nome do prato |
| `category_id` | TEXT FK | Referência a `menu_categories(id)` |
| ... | ... | Outros campos |

## 5. Validação e Testes

O sistema inclui testes de integração (`services/integration.test.ts`) que verificam:
- A não-criação de categorias fantasmas ("Bebidas").
- A correta associação de produtos às suas categorias originais.
- A integridade do feed JSON híbrido.

## 6. Solução de Problemas Comuns

### Produtos "Misturados" ou Fora de Ordem
- **Causa**: Falta de campo `sort_order` explícito em versões anteriores.
- **Solução v1.1.60**: O sistema agora ordena categorias baseado em `sort_order` e depois alfabeticamente. Ao criar novas categorias, uma ordem sequencial é atribuída.

### Produtos "Sem Categoria" após Restart
- **Causa**: IDs de categoria incompatíveis entre backup e estado atual.
- **Solução**: O sistema de backup V3 garante que IDs são preservados. Se um produto perder sua categoria, ele vai para a aba "Sem Categoria" (filtros) em vez de desaparecer ou ir para "Bebidas".
