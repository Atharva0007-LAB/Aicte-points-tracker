import { query, testConnection } from './index';

export async function runMigrations() {
  console.log('🚀 Running database migrations for Phase 2...');

  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Database connection failed prior to migration.');
  }

  // Create Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CLUB', 'TNP', 'STUDENT')),
      department VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Session table for express-session storage
  await query(`
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR PRIMARY KEY NOT NULL,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
  `);

  // Create AICTE Categories table
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      max_points INT NOT NULL DEFAULT 40,
      min_points INT NOT NULL DEFAULT 10,
      description TEXT
    );
  `);

  // Create Events table
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
      points INT NOT NULL DEFAULT 10,
      event_date DATE NOT NULL,
      location VARCHAR(255),
      organizer_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
      organizer_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Student Activity Claims table
  await query(`
    CREATE TABLE IF NOT EXISTS student_activities (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      event_id VARCHAR(36) REFERENCES events(id) ON DELETE SET NULL,
      category_id VARCHAR(36) REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(255) NOT NULL,
      points_requested INT NOT NULL,
      points_awarded INT DEFAULT 0,
      proof_details TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
      reviewer_role VARCHAR(50),
      rejection_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Certificates table
  await query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
      total_points INT NOT NULL,
      issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
      certificate_code VARCHAR(100) UNIQUE NOT NULL
    );
  `);

  console.log('✅ Migrations completed. Tables "users", "session", "categories", "events", "student_activities", and "certificates" are ready.');
}

if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
