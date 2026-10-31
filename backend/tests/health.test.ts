import { createServer } from '../src/server.js';
import http from 'http';

async function runHealthTest() {
  console.log('🧪 Starting BahiVerse AI Backend Self-Diagnostic Test...');
  const app = createServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(3099, resolve));

  try {
    const res = await fetch('http://localhost:3099/api/health');
    const data = await res.json();

    console.log('✅ Response Code:', res.status);
    console.log('✅ Health Payload:', data);

    if (res.status === 200 && data.status === 'ok') {
      console.log('🎉 Backend Health Check Passed Successfully!');
    } else {
      console.error('❌ Health check failed validation');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      // Clean shutdown
    });
  }
}

runHealthTest();
