# BahiVerse AI — REST API Endpoint Reference

All protected endpoints require the HTTP header:
`Authorization: Bearer <jwt-token>`

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register store owner & create business profile.
  - Body: `{ name, email, password, businessName? }`
- `POST /api/auth/login` — Authenticate credentials & return JWT.
  - Body: `{ email, password }`
- `GET /api/auth/me` — Retrieve active session profile.

---

## 2. Bills & Invoices (`/api/bills`)
- `GET /api/bills` — Paginated bill list (`?page=1&limit=20&status=pending`).
- `GET /api/bills/stats` — Overall totals, revenue, and AI accuracy metrics.
- `GET /api/bills/:id` — Full bill details, raw OCR, items, and corrections.
- `POST /api/bills/capture` — Multipart upload (`image`) or manual JSON capture.
- `PUT /api/bills/:id/review` — Save human review and line-item corrections.
- `PATCH /api/bills/:id/approve` — Lock bill into store's ledger.
- `DELETE /api/bills/:id` — Delete bill and clean up image asset.

---

## 3. Business Profile (`/api/business`)
- `GET /api/business` — Store profile and entity counts.
- `PUT /api/business` — Update name, GSTIN, and address.
- `GET /api/business/customers` — Customer accounts list.
- `POST /api/business/customers` — Create customer account.
- `GET /api/business/products` — Catalog products list.
- `POST /api/business/products` — Create catalog product.

---

## 4. Shop Vocabulary (`/api/vocab`)
- `GET /api/vocab` — List shop dialect and colloquial term mappings.
- `POST /api/vocab` — Map local term to normalized standard product.
- `DELETE /api/vocab/:id` — Delete custom mapping.

---

## 5. WhisperFlow Voice (`/api/voice`)
- `POST /api/voice` — Process audio transcript into structured action.
  - Body: `{ transcript, language, billId? }`

---

## 6. Normalization Telemetry (`/api/normalization`)
- `GET /api/normalization/health` — Returns 3NF schema statistics and drift checks.

---

## 7. Export Center (`/api/export`)
- `POST /api/export` — Generate CSV, JSON, or Tally XML file.
- `GET /api/export/history` — Export history log.

---

## 8. Health Check (`/api/health`)
- `GET /api/health` — Backend status, database connection ping, and active AI engine mode.
