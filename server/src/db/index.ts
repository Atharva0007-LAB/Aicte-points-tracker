import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { config } from '../config/env';

let pgPool: pg.Pool | null = null;
let pgliteDb: PGlite | null = null;

export async function getDb() {
  if (pgliteDb) return { mode: 'pglite', db: pgliteDb };
  if (pgPool) return { mode: 'pool', db: pgPool };

  if (config.pgUsePglite) {
    try {
      const dataDir = path.resolve(process.cwd(), '.pglite_data');
      pgliteDb = new PGlite(dataDir);
      console.log('⚡ Connected to PostgreSQL via embedded PGlite instance.');
      return { mode: 'pglite', db: pgliteDb };
    } catch (err) {
      console.warn('⚠️ PGlite initialization failed, falling back to pg.Pool:', err);
    }
  }

  // Fallback to standard pg.Pool
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    host: config.pgHost,
    port: config.pgPort,
    user: config.pgUser,
    password: config.pgPassword,
    database: config.pgDatabase,
  });

  return { mode: 'pool', db: pgPool };
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[] }> {
  const { mode, db } = await getDb();
  if (mode === 'pglite') {
    const res = await (db as PGlite).query(text, params);
    return { rows: (res.rows as T[]) || [] };
  } else {
    const res = await (db as pg.Pool).query(text, params);
    return { rows: res.rows };
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await query('SELECT 1 as connected');
    return res.rows[0]?.connected === 1;
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
    return false;
  }
}
