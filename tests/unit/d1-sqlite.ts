// Minimal D1-compatible wrapper over node:sqlite so the real migration SQL and the real handler SQL are exercised.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';

type Row = Record<string, unknown>;

export function makeD1(): { db: D1Database; raw: DatabaseSync } {
  const raw = new DatabaseSync(':memory:');
  const dir = new URL('../../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) raw.exec(readFileSync(new URL(f, dir), 'utf8'));
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async <T = Row>() => (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null,
    run: async () => {
      raw.prepare(sql).run(...(args as never[]));
      return { success: true, meta: {} };
    },
    all: async () => ({ results: raw.prepare(sql).all(...(args as never[])) as Row[] }),
    __run: () => raw.prepare(sql).run(...(args as never[])),
  });
  const db = {
    prepare: (sql: string) => stmt(sql),
    batch: async (list: Array<ReturnType<typeof stmt>>) => {
      raw.exec('BEGIN');
      try {
        for (const s of list) s.__run();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
      return list.map(() => ({ success: true }));
    },
  } as unknown as D1Database;
  return { db, raw };
}
