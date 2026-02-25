# Images Folder

Esta pasta é destinada às imagens dos pratos do menu.

## Como adicionar imagens:

1. **Formato**: Use formatos web (JPG, PNG, WebP)
2. **Tamanho recomendado**: 800x600px ou superior
3. **Nome**: Use nomes descritivos (ex: `frango-assado.jpg`)

## Como usar:

No formulário do prato, adicione o nome do arquivo no campo `image_url`:
- Exemplo: `frango-assado.jpg`
- O sistema irá procurar em `/images/frango-assado.jpg`

## Imagens padrão:

- Se não houver imagem, o sistema usará `/logo.png`
- Em caso de erro no carregamento, também usará `/logo.png`

## Otimização:

- Comprima as imagens para web
- Use formatos modernos como WebP para melhor performance
- Mantenha o tamanho do arquivo abaixo de 500KB por imagem
