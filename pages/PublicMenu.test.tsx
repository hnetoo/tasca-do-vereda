import { describe, it, expect } from 'vitest';
import { isValidImageUrl } from '../services/qrMenuService';

describe('isValidImageUrl', () => {
  it('retorna false para valores vazios ou inválidos', () => {
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('   ')).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
  });

  it('aceita URLs http/https', () => {
    expect(isValidImageUrl('http://exemplo.com/img.png')).toBe(true);
    expect(isValidImageUrl('https://exemplo.com/img.png')).toBe(true);
  });

  it('aceita data URLs de imagem', () => {
    expect(isValidImageUrl('data:image/png;base64,aaaa')).toBe(true);
  });

  it('aceita caminhos absolutos locais', () => {
    expect(isValidImageUrl('/imagens/produto.png')).toBe(true);
  });

  it('rejeita strings aleatórias sem prefixo conhecido', () => {
    expect(isValidImageUrl('sem_protocolo.png')).toBe(false);
    expect(isValidImageUrl('foo')).toBe(false);
  });
});
