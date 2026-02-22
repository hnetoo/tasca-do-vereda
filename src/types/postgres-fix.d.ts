import * as pg from 'postgres';

declare module 'postgres' {
  interface Sql<T extends Record<string, unknown>> {
    // Adiciona uma sobrecarga para permitir sql(object) dentro de template literals
    // Isso informa ao TypeScript que quando um objeto é passado, ele retorna um Helper
    <U extends object>(obj: U, ...keys: (keyof U)[]): pg.Helper<U, (keyof U)[]>;
    <U extends object>(obj: U, keys: (keyof U)[]): pg.Helper<U, (keyof U)[]>;
  }
}
