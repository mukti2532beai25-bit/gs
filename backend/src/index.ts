import { createServer } from './server.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './config/database.js';

async function bootstrap() {
  const app = createServer();
  const dbStatus = await checkDatabaseConnection();

  console.log('\n======================================================');
  console.log('🌌 BahiVerse AI Backend Engine');
  console.log('======================================================');
  console.log(`Port:           ${env.PORT}`);
  console.log(`Environment:    ${env.NODE_ENV}`);
  console.log(`OCR Provider:   ${env.OCR_PROVIDER}`);
  console.log(`Voice Provider: ${env.VOICE_PROVIDER}`);

  if (dbStatus.isConnected) {
    console.log(`Database:       Connected to ${dbStatus.provider} ✅`);
  } else {
    console.log(`Database:       Offline / Unreachable ⚠️`);
    console.log(`                (${dbStatus.error})`);
    console.log('                To start PostgreSQL: run `docker compose up -d`');
  }
  console.log('======================================================\n');

  app.listen(env.PORT, () => {
    console.log(`🚀 API Server ready at http://localhost:${env.PORT}`);
    console.log(`🩺 Health check:    http://localhost:${env.PORT}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap failure:', err);
  process.exit(1);
});
