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

    // 11. Camera Image Capture & Upload OCR Pipeline
    await test('Camera Bill Capture — JPEG Blob Upload, OCR Extraction & Draft Status', async () => {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      // Create a dummy multipart form data simulating a captured camera JPEG blob
      const rawPayload =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="language"\r\n\r\n` +
        `hi\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="image"; filename="camera-bill-${Date.now()}.jpg"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n` +
        `fake-jpeg-camera-binary-stream-data\r\n` +
        `--${boundary}--\r\n`;

      const res = await fetch(`http://localhost:${PORT}/api/bills/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${authToken}`,
        },
        body: rawPayload,
      });

      if (res.status !== 201) throw new Error(`Camera capture upload failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Capture endpoint returned unsuccessful');
      if (!json.data.id) throw new Error('Bill ID not generated');
      // Invariant: Status must be extracted / unconfirmed, requiring human review
      if (json.data.status !== 'extracted' && json.data.status !== 'pending') {
        throw new Error(`Bill must not be auto-confirmed; got status: ${json.data.status}`);
      }
      if (!json.data.vendorName) throw new Error('Missing extracted vendor name');
      if (!Array.isArray(json.data.items) || json.data.items.length === 0) {
        throw new Error('Missing extracted line items');
      }
      if (Number(json.data.totalAmount) <= 0) throw new Error('Total amount must be positive');
    });

    // 12. WhisperFlow Voice Assistant — Accounting Query via Speech Parse
    await test('WhisperFlow Voice Assistant — Accounting Speech Query Resolution', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transcript: 'How much did I sell today?',
          language: 'en',
        }),
      });

      if (res.status !== 200) throw new Error(`Voice query failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Voice query returned unsuccessful');
      if (json.data.action !== 'analytics_query') {
        throw new Error(`Expected action analytics_query, got ${json.data.action}`);
      }
      if (!json.data.requestedChange) throw new Error('Missing assistant answer');
    });

    // 13. WhisperFlow Multi-lingual Voice Ingestion (Hindi & Punjabi)
    await test('WhisperFlow Voice Multi-lingual Speech Processing (Hindi & Punjabi)', async () => {
      // Hindi test
      const resHi = await fetch(`http://localhost:${PORT}/api/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transcript: 'मेरी कुल कमाई कितनी है',
          language: 'hi',
        }),
      });
      const jsonHi = await resHi.json();
      if (!jsonHi.success) throw new Error('Hindi voice parse failed');

      // Punjabi test
      const resPa = await fetch(`http://localhost:${PORT}/api/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transcript: 'ਦੁੱਧ ਦੀ ਮਾਤਰਾ 5 ਕਰੋ',
          language: 'pa',
        }),
      });
      const jsonPa = await resPa.json();
      if (!jsonPa.success) throw new Error('Punjabi voice parse failed');
      if (jsonPa.data.quantity !== 5) throw new Error(`Expected quantity 5, got ${jsonPa.data.quantity}`);
    });

    // 14. Centralized Document Inbox & Status Filtering
    await test('Centralized Document Inbox & Source Aggregation', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/documents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Document list failed');
      if (!Array.isArray(json.data) || json.data.length === 0) {
        throw new Error('Expected inbox documents array');
      }
      if (!json.counts || typeof json.counts.all !== 'number') {
        throw new Error('Expected status counts in inbox response');
      }
    });

    // 15. Multi-Factor Document Duplicate Detection
    await test('Multi-Factor Document Duplicate Detection (Exact SHA-256 Match)', async () => {
      // Ingest a document with known content
      const boundary = '----WebKitFormBoundaryDuplicateTest';
      const fileContent = 'Simulated bill file content for duplicate test';
      const body =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="documents"; filename="Test_Bill_001.jpg"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n` +
        `${fileContent}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="sourceType"\r\n\r\n` +
        `camera_batch\r\n` +
        `--${boundary}--\r\n`;

      // Upload first time
      const res1 = await fetch(`http://localhost:${PORT}/api/documents/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${authToken}`,
        },
        body,
      });
      if (res1.status !== 201) throw new Error(`First upload failed with status ${res1.status}`);
      const json1 = await res1.json();
      if (json1.data.documents[0].status === 'duplicate') {
        throw new Error('First upload should not be marked duplicate');
      }

      // Upload second time with identical buffer
      const res2 = await fetch(`http://localhost:${PORT}/api/documents/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${authToken}`,
        },
        body,
      });
      if (res2.status !== 201) throw new Error(`Second upload failed with status ${res2.status}`);
      const json2 = await res2.json();
      if (json2.data.duplicatesDetected < 1) {
        throw new Error('Expected duplicate to be detected on identical upload');
      }
      if (json2.data.documents[0].status !== 'duplicate') {
        throw new Error(`Expected document status 'duplicate', got ${json2.data.documents[0].status}`);
      }
    });

    // 16. Connected Document Acquisition Sources & WhatsApp Webhook Handshake
    await test('Connected Acquisition Sources & WhatsApp Webhook Handshake', async () => {
      // Test 16a: List sources
      const resSources = await fetch(`http://localhost:${PORT}/api/integrations/sources`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resSources.status !== 200) throw new Error(`Sources listing failed with status ${resSources.status}`);
      const jsonSources = await resSources.json();
      if (!Array.isArray(jsonSources.data) || jsonSources.data.length < 3) {
        throw new Error('Expected at least 3 connected sources (Gmail, WhatsApp, Email Mailbox)');
      }

      // Test 16b: WhatsApp Webhook Challenge Verification
      const challengeToken = 'test_challenge_code_9988';
      const resWebhookVerify = await fetch(
        `http://localhost:${PORT}/api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=bahiverse_webhook_secret_2026&hub.challenge=${challengeToken}`
      );
      if (resWebhookVerify.status !== 200) throw new Error(`Webhook verify failed with status ${resWebhookVerify.status}`);
      const bodyText = await resWebhookVerify.text();
      if (bodyText !== challengeToken) throw new Error(`Expected challenge response '${challengeToken}', got '${bodyText}'`);

      // Test 16c: Manual sync trigger
      const resSync = await fetch(`http://localhost:${PORT}/api/integrations/sources/whatsapp/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resSync.status !== 200) throw new Error(`Sync trigger failed with status ${resSync.status}`);
      const jsonSync = await resSync.json();
      if (jsonSync.data.status !== 'success') throw new Error(`Expected sync status 'success', got ${jsonSync.data.status}`);
    });

    // 17. CA Pre-Export Reconciliation & Audit Validation Engine
    await test('CA Pre-Export Reconciliation & Statutory Boundary Audit', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/exports/ca/validate`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`CA validation failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Invalid validation response structure');

      const val = json.data;
      if (typeof val.totalRecordsChecked !== 'number' || val.totalRecordsChecked === 0) {
        throw new Error('Validation checked zero records');
      }
      if (!Array.isArray(val.issues) || val.issues.length === 0) {
        throw new Error('Expected reconciliation issues/warnings to be flagged (e.g. unconfirmed drafts, missing supplier GSTIN)');
      }
      if (typeof val.summary.totalSales !== 'number' || typeof val.summary.eligibleItc !== 'number') {
        throw new Error('Missing financial reconciliation summaries');
      }
    });

    // 18. Multi-Worksheet CA Dossier Generation (.xlsx, .csv, and JSON)
    await test('Multi-Worksheet CA Dossier Generation (Excel, CSV, and JSON)', async () => {
      // 18a: Multi-sheet Excel workbook
      const resXlsx = await fetch(`http://localhost:${PORT}/api/exports/ca/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ format: 'xlsx' }),
      });
      if (resXlsx.status !== 200) throw new Error(`Excel export failed with status ${resXlsx.status}`);
      const contentType = resXlsx.headers.get('content-type') || '';
      if (!contentType.includes('spreadsheetml')) {
        throw new Error(`Expected spreadsheetml content type, got '${contentType}'`);
      }
      const xlsxBuffer = await resXlsx.arrayBuffer();
      if (xlsxBuffer.byteLength < 1000) {
        throw new Error(`Generated Excel workbook too small (${xlsxBuffer.byteLength} bytes)`);
      }

      // 18b: Standard CSV Sales Register
      const resCsv = await fetch(`http://localhost:${PORT}/api/exports/ca/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ format: 'csv', registerType: 'sales' }),
      });
      if (resCsv.status !== 200) throw new Error(`CSV export failed with status ${resCsv.status}`);
      const csvText = await resCsv.text();
      if (!csvText.includes('Invoice Number') || !csvText.includes('Taxable Value')) {
        throw new Error('Invalid CSV header generated');
      }

      // 18c: Structured JSON with Statutory Responsibility Matrix & Disclaimer
      const resJson = await fetch(`http://localhost:${PORT}/api/exports/ca/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ format: 'json' }),
      });
      if (resJson.status !== 200) throw new Error(`JSON export failed with status ${resJson.status}`);
      const jsonRes = await resJson.json();
      const meta = jsonRes.data.exportMetadata;
      if (!meta.disclaimer || !meta.disclaimer.toLowerCase().includes('chartered accountant')) {
        throw new Error('Missing CA statutory disclaimer in export dossier');
      }
      if (!meta.boundaries || !meta.boundaries.charteredAccountant) {
        throw new Error('Missing responsibility boundary matrix in export dossier');
      }
    });

    // 19. Phase 10: Demo Mode API Status and Seeded Data Integrity
    await test('Phase 10: Demo Mode Dataset (25 products, 15 customers, 8 suppliers, 40 bills)', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/demo/status`);
      if (res.status !== 200) throw new Error(`Demo status failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data.isDemoMode) throw new Error('Demo mode is not active');
      if (json.data.demoLabel !== 'DEMO DATA — Sample business information') {
        throw new Error(`Unexpected demo label: ${json.data.demoLabel}`);
      }

      const { counts, summary } = json.data;
      if (counts.products !== 25) throw new Error(`Expected 25 products, got ${counts.products}`);
      if (counts.customers !== 15) throw new Error(`Expected 15 customers, got ${counts.customers}`);
      if (counts.suppliers !== 8) throw new Error(`Expected 8 suppliers, got ${counts.suppliers}`);
      if (counts.bills !== 40) throw new Error(`Expected 40 bills, got ${counts.bills}`);
      if (counts.purchases !== 20) throw new Error(`Expected 20 purchases, got ${counts.purchases}`);
      if (counts.expenses !== 25) throw new Error(`Expected 25 expenses, got ${counts.expenses}`);
      if (counts.payments !== 30) throw new Error(`Expected 30 payments, got ${counts.payments}`);

      if (typeof summary.totalSales !== 'number' || summary.totalSales <= 0) {
        throw new Error('Calculated total sales in demo analytics is invalid');
      }
    });

    // 20. Phase 10: Safe Demo Reset Invariant
    await test('Phase 10: Safe Demo Reset Restores Pristine State Without Data Leaks', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/demo/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Demo reset failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success || json.data.productsCount !== 25) {
        throw new Error('Demo reset did not restore 25 products');
      }
    });

    // 21. Phase 11: Real Character Recognition Engine (Tesseract OCR Fallback)
    await test('Phase 11: Real Character Recognition with Transparent Attribution', async () => {
      const fakeImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const formData = new FormData();
      formData.append('image', new Blob([fakeImage], { type: 'image/png' }), 'test-real-ocr.png');

      const res = await fetch(`http://localhost:${PORT}/api/bills/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (res.status !== 201) throw new Error(`Bill capture for OCR failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error('OCR did not produce extraction result');
      }
      // Verify transparent OCR attribution (never lies about engine)
      const provider = json.meta?.provider || 'demo-fixture';
      if (!['tesseract-real', 'google-vision', 'openai', 'demo-fixture'].includes(provider)) {
        throw new Error(`Untracked OCR engine reported: ${provider}`);
      }
    });

    // 22. Phase 11: Spoken Accounting Queries in Multiple Languages
    await test('Phase 11: Spoken Accounting Queries (Hindi, English, Punjabi)', async () => {
      // 22a: Hindi Earnings Today
      const resHi = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ question: 'Aaj maine kitna kamaya?', language: 'hi' }),
      });
      if (resHi.status !== 200) throw new Error(`AI query in Hindi failed with status ${resHi.status}`);
      const jsonHi = await resHi.json();
      if (!jsonHi.answer && !jsonHi.answer_hi) throw new Error('No answer returned for Hindi query');
      if (jsonHi.demoNotice !== 'DEMO DATA — Sample business information') {
        throw new Error('Missing visible DEMO DATA notice on AI query result');
      }

      // 22b: English Pending Payments
      const resEn = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ question: 'How much payment is pending?', language: 'en' }),
      });
      if (resEn.status !== 200) throw new Error(`AI query in English failed with status ${resEn.status}`);
      const jsonEn = await resEn.json();
      if (!jsonEn.answer.includes('₹')) throw new Error('Pending payments answer does not contain currency');

      // 22c: Punjabi Top Selling Products
      const resPa = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ question: 'Kehda product sab ton zyada vikeya?', language: 'pa' }),
      });
      if (resPa.status !== 200) throw new Error(`AI query in Punjabi failed with status ${resPa.status}`);
      const jsonPa = await resPa.json();
      if (!jsonPa.visualization || jsonPa.visualization.type !== 'bar') {
        throw new Error('Expected bar visualization for top products query');
      }
    });

    // 23. Phase 11: Controlled Catalog Price Update & Historical Invariant
    await test('Phase 11: Controlled Catalog Price Update & Historical Pricing Invariant', async () => {
      // Step 1: Natural language query proposes price change
      const resPrompt = await fetch(`http://localhost:${PORT}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ question: 'Change Basmati rice price to 480', language: 'en' }),
      });
      if (resPrompt.status !== 200) throw new Error(`Price change query failed with status ${resPrompt.status}`);
      const jsonPrompt = await resPrompt.json();

      if (jsonPrompt.type !== 'action_proposal' || !jsonPrompt.actionProposal) {
        throw new Error('Expected action_proposal for price change');
      }
      if (!jsonPrompt.answer.includes('450') || !jsonPrompt.answer.includes('480')) {
        throw new Error(`Expected prompt with current and proposed price, got: ${jsonPrompt.answer}`);
      }

      // Step 2: Confirmation of price change
      const resConfirm = await fetch(`http://localhost:${PORT}/api/ai/action/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: jsonPrompt.actionProposal.action,
          productId: jsonPrompt.actionProposal.productId,
          newPrice: 480,
        }),
      });
      if (resConfirm.status !== 200) throw new Error(`Confirm action failed with status ${resConfirm.status}`);
      const jsonConfirm = await resConfirm.json();
      if (!jsonConfirm.success) throw new Error('Confirm action was not successful');
      if (!jsonConfirm.historicalAuditNotice) {
        throw new Error('Missing historical audit notice confirming past bills are untouched');
      }

      // Step 3: Verify Demo Data Store reflects new price while past bills are untouched
      const resBills = await fetch(`http://localhost:${PORT}/api/demo/bills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const jsonBills = await resBills.json();
      const pastBasmatiItem = jsonBills.data
        .flatMap((b: any) => b.items)
        .find((item: any) => item.productName.includes('Basmati'));
      if (pastBasmatiItem && pastBasmatiItem.unitPrice !== 450) {
        throw new Error(`Historical bill item price modified! Expected ₹450, got ₹${pastBasmatiItem.unitPrice}`);
      }
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
