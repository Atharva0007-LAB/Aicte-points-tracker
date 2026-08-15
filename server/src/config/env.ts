import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'aicte_points_tracker_super_secret_session_key_2026',
  pgUsePglite: process.env.PG_USE_PGLITE !== 'false',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/aicte_tracker',
  pgHost: process.env.PGHOST || 'localhost',
  pgPort: parseInt(process.env.PGPORT || '5432', 10),
  pgUser: process.env.PGUSER || 'postgres',
  pgPassword: process.env.PGPASSWORD || 'postgres',
  pgDatabase: process.env.PGDATABASE || 'aicte_tracker',
};
