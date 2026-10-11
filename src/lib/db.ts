import { neon } from '@neondatabase/serverless';

type Row    = Record<string, unknown>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

let _sql: SqlTag | null = null;

export function getDb(): SqlTag {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL must be set');
    _sql = neon(url) as unknown as SqlTag;
  }
  return _sql;
}
