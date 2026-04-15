declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      all: (...params: unknown[]) => Array<Record<string, string | number | null>>;
      get: (...params: unknown[]) => Record<string, string | number | null>;
      run: (...params: unknown[]) => unknown;
    };
    close(): void;
  }
}
