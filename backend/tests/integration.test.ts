import { createServer } from '../src/server.js';
import http from 'http';

async function runIntegrationTests() {
  console.log('\n======================================================');
  console.log('🧪 BahiVerse AI End-to-End Integration Test Suite');
  console.log('======================================================\n');

  const app = createServer();
  const server = http.createServer(app);
  const PORT = 3199;

  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
      process.exitCode = 1;
    }
  }

  try {
    // 1. Health check test
    await test('System Health Diagnostics & AI Provider Status', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (json.status !== 'ok') throw new Error('Status not ok');
      if (!json.service.includes('BahiVerse')) throw new Error('Invalid service header');
    });

    // 2. Auth login test
    let authToken = '';
    await test('Authentication & Tenant Profile Handshake', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@bahiverse.ai', password: 'password123' }),
      });
      if (res.status !== 200) throw new Error(`Auth failed with status ${res.status}`);
      const json = await res.json();
      if (!json.data?.token) throw new Error('Token not returned');
      authToken = json.data.token;
    });

    // 3. Multi-lingual Voice Command Parser test
    await test('WhisperFlow Multi-Lingual Voice Command Parsing', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transcript: 'Correct the quantity of milk to 5',
          language: 'en',
        }),
      });
      if (res.status !== 200) throw new Error(`Voice parse failed with status ${res.status}`);
      const json = await res.json();
      if (json.data.action !== 'correct_quantity') throw new Error(`Wrong action: ${json.data.action}`);
      if (json.data.quantity !== 5) throw new Error(`Wrong quantity: ${json.data.quantity}`);
    });

    // 4. Relational Schema & 3NF Normalization test
    await test('3D Database Architect Relational Schema & 3NF Metadata', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/normalization/schema`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Schema metadata failed with status ${res.status}`);
      const json = await res.json();
      if (!json.data.tables || json.data.tables.length < 5) throw new Error('Incomplete relational tables');
      if (!json.data.normalizationStages || json.data.normalizationStages.length !== 4) {
        throw new Error('Missing 1NF/2NF/3NF stages');
      }
    });

    // 5. Export Center preview test
    await test('Export Center Preview & RFC-4180 Dataset Compilation', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/export/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: 'csv',
          entity: 'bills',
        }),
      });
      if (res.status !== 200) throw new Error(`Export preview failed with status ${res.status}`);
      const json = await res.json();
      if (typeof json.data.totalCount !== 'number') throw new Error('Total count missing');
      if (!Array.isArray(json.data.sampleRows)) throw new Error('Sample rows missing');
    });

    console.log('\n======================================================');
    console.log(`🎉 Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runIntegrationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
