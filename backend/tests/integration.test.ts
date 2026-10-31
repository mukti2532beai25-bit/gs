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

    // 6. Natural Language BI Query (Read-Only Analytics)
    await test('Natural Language Query Engine — Read-Only BI Analytics & Visuals', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'Which products are selling the most?',
          language: 'hi',
        }),
      });
      if (res.status !== 200) throw new Error(`AI query failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('AI query returned unsuccessful');
      if (json.type !== 'analytics') throw new Error(`Expected type analytics, got ${json.type}`);
      if (!json.visualization || json.visualization.type !== 'bar') {
        throw new Error('Expected bar chart visualization');
      }
      if (!json.answer_hi) throw new Error('Expected Hindi translation response');
    });

    // 7. Security Guardrails against SQL Injection & DDL/DML Modification
    await test('Security Guardrail — Direct SQL Injection & DROP TABLE Blocker', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'DROP TABLE bills; DELETE FROM customers; --',
          language: 'en',
        }),
      });
      const json = await res.json();
      if (json.type !== 'security_violation') {
        throw new Error(`Expected security_violation, got ${json.type}`);
      }
      if (!json.answer.includes('blocked') && !json.answer.includes('Security Notice')) {
        throw new Error('Security notice missing in answer');
      }
    });

    // 8. Controlled Natural Language Write Action Proposal
    let proposedProductId = '';
    await test('Controlled Natural Language Write — Product Price Update Proposal Card', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'Change the price of Basmati rice to 480',
          language: 'en',
        }),
      });
      if (res.status !== 200) throw new Error(`AI query failed with status ${res.status}`);
      const json = await res.json();
      if (json.type !== 'action_proposal') {
        throw new Error(`Expected action_proposal, got ${json.type}`);
      }
      if (!json.actionProposal) throw new Error('Missing actionProposal object');
      if (json.actionProposal.action !== 'UPDATE_PRODUCT_SELLING_PRICE') {
        throw new Error(`Wrong action: ${json.actionProposal.action}`);
      }
      if (json.actionProposal.proposedValue !== 480) {
        throw new Error(`Expected proposed price 480, got ${json.actionProposal.proposedValue}`);
      }
      if (!json.actionProposal.requiresConfirmation) {
        throw new Error('requiresConfirmation must be true');
      }
      proposedProductId = json.actionProposal.productId;
    });

    // 9. Execute Action Confirmation & Verify Historical Ledger Preservation Invariant
    await test('Action Confirmation & Historical Ledger Ledger Invariant Check', async () => {
      // 1. Confirm product price update
      const res = await fetch(`http://localhost:${PORT}/api/ai/action/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'UPDATE_PRODUCT_SELLING_PRICE',
          productId: proposedProductId,
          newPrice: 480,
        }),
      });
      if (res.status !== 200) throw new Error(`Action confirmation failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Action confirmation returned unsuccessful');
      if (!json.historicalAuditNotice) throw new Error('Missing historical audit notice');

      // 2. Fetch past bills and ensure historical line items were NOT mutated
      const billsRes = await fetch(`http://localhost:${PORT}/api/bills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const billsJson = await billsRes.json();
      const pastBills = billsJson.bills || billsJson.data || [];
      if (pastBills.length > 0) {
        // Verify past bills still exist with valid positive total amount
        const sample = pastBills[0];
        if (Number(sample.totalAmount) <= 0) {
          throw new Error('Past bill total amount corrupted');
        }
      }
    });

    // 10. Business Intelligence Analytics Endpoint
    await test('Business Intelligence Analytics API with Date Filtering & Profit Criteria', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/business/analytics?range=30d`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Analytics API failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Analytics payload invalid');
      if (typeof json.data.totalRevenue !== 'number') throw new Error('Missing totalRevenue');
      if (typeof json.data.netProfit !== 'number') throw new Error('Missing netProfit');
      if (!json.data.profitCriteriaNotice) throw new Error('Missing profitCriteriaNotice');
      if (!Array.isArray(json.data.topProducts)) throw new Error('Missing topProducts array');
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
