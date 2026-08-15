import { createApp } from './app';
import { config } from './config/env';
import { testConnection } from './db/index';
import { seedDatabase } from './db/seed';

async function startServer() {
  console.log('⚡ Initializing AICTE Points Tracker Backend...');

  try {
    const isDbConnected = await testConnection();
    if (isDbConnected) {
      console.log('✅ PostgreSQL database connection verified.');
      await seedDatabase();
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
