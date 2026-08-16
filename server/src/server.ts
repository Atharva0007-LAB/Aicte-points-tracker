import { createApp } from './app';
import { config } from './config/env';
import { testConnection } from './db/index';
import { runMigrations } from './db/migrate';
import { seedDatabase, needsSeeding } from './db/seed';

async function startServer() {
  console.log('⚡ Initializing AICTE Points Tracker Backend...');

  try {
    const isDbConnected = await testConnection();
    if (isDbConnected) {
      console.log('✅ PostgreSQL database connection verified.');

      // Migrations are safe to run on every boot (CREATE TABLE IF NOT EXISTS).
      await runMigrations();

      // Seeding is destructive (resets demo data) and must only ever run
      // once, against a genuinely empty database — never on every restart,
      // or real production data (memberships, registrations, attendance,
      // claims) would be wiped every time the server restarts.
      const shouldSeed = await needsSeeding();
      if (shouldSeed) {
        await seedDatabase();
      } else {
        console.log('ℹ️ Database already has data — skipping seed, migrations only.');
      }
    } else {
      console.warn('⚠️ Could not verify DB connection on boot. Will retry on request.');
    }
  } catch (err) {
    console.error('⚠️ Warning during DB startup checks:', err);
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 AICTE Points Tracker Backend running on port ${config.port}`);
    console.log(`🌐 API Base URL: http://localhost:${config.port}/api`);
    console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});