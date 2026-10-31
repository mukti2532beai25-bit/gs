# 🌌 BahiVerse AI — Premium 3D Digital Accounting Assistant

> **AI-Powered Digital Accounting Assistant for Small Shopkeepers that transforms handwritten and paper bills in Hindi, English, and Punjabi into organized, normalized, and tax-ready digital records with real-time 3D WebGL visualizations, acoustic dialect voice correction (WhisperFlow), and seamless Tally / CSV exports.**

[![Node](https://img.shields.io/badge/Node-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black.svg)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite%20%7C%20Postgres-5A67D8.svg)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## 🌟 Tech Stack & Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- **3D & WebGL Engine:** Three.js + `@react-three/fiber` + `@react-three/drei`
- **Animations & Transitions:** Framer Motion (restrained physics, spring dampening, responsive glow)
- **Icons:** `lucide-react`
- **Backend API:** Express 4 + TypeScript (`tsx`)
- **Database ORM:** Prisma 5 (PostgreSQL compatible, SQLite for instant zero-config dev)
- **Authentication:** PBKDF2-style SHA-256 random salt hashing + HMAC-SHA256 JWT sessions
- **File Uploads:** Multer with file type & size validation
- **Validation:** Zod schema validation

---

## 🎨 Complete 3D Visual Identity (6 Dedicated Scenes)

| Page | 3D Scene Component | Real-Time Interactive Experience |
|---|---|---|
| **1. Dashboard** | `LedgerEnvironment3D` | Floating holographic ledger sheets, ambient currency core ring, and dynamic financial transaction particle cloud. |
| **2. Capture Bill** | `ScanningPortal3D` | Interactive 3D scanning portal with laser sweep plane, holographic bill document, and corner target reticles. |
| **3. Bill Review** | `ExtractionDataScene3D` | 3D extraction confidence telemetry with color-coded nodes (emerald >90%, cyan 75-90%, gold <75%) and bezier data trajectories. |
| **4. WhisperFlow** | `AudioWaveform3D` | Interactive circular 3D audio waveform spectrum reacting in real-time to voice input with pulsating voice core halos. |
| **5. 3D Architect** | `DatabaseGraph3D` | Real-time 3D relational database ER graph displaying 3NF normalized tables (`Business`, `Bill`, `BillItem`, `Customer`, `Product`, `Vocabulary`) with glowing foreign key relations. |
| **6. Export Center** | `ExportCubes3D` | Animated 3D voxel data cubes aggregating into export packages with color-coded format triggers (CSV, JSON, Tally XML). |

---

## 🔑 Pre-Seeded Demo Credentials

The database auto-seeds on first boot with Sharma General Store's records:
- **Email:** `demo@bahiverse.ai`
- **Password:** `Demo@1234`
- *Or click the "✨ Fill Seeded Demo Account" button in the sign-in modal.*

---

## 📡 API Routes & Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Registers new store owner + creates initial `Business` profile |
| `POST` | `/api/auth/login` | Authenticates store credentials & returns signed JWT |
| `GET` | `/api/auth/me` | Validates JWT token and fetches user + business profile |

### 🧾 Bills & Invoices (`/api/bills`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bills` | Returns paginated list of bills for the store |
| `GET` | `/api/bills/stats` | Aggregates total bills, revenue, review counts, and average AI confidence |
| `GET` | `/api/bills/:id` | Retrieves full bill details, raw OCR text, and line items |
| `POST` | `/api/bills/capture` | Uploads receipt image and runs OCR / AI extraction pipeline |
| `PUT` | `/api/bills/:id/review` | Saves shopkeeper corrections, edits line items, and recalculates taxes |
| `POST` | `/api/bills/voice` | Parses natural language speech commands into structured schema operations |
| `PATCH` | `/api/bills/:id/approve` | Finalizes and locks bill into store's general ledger |
| `DELETE` | `/api/bills/:id` | Deletes bill record and cleans up associated file uploads |

### 🏪 Business & Vocabulary (`/api/business`, `/api/vocab`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/business` | Returns business profile and entity counts |
| `PUT` | `/api/business` | Updates store legal name, GSTIN, and address |
| `GET` | `/api/business/customers` | Retrieves list of customers associated with the store |
| `GET` | `/api/business/products` | Retrieves product catalog items and unit rates |
| `GET` | `/api/vocab` | Retrieves custom shop vocabulary and slang mappings |
| `POST` | `/api/vocab` | Adds custom term mapping (e.g., "doodh" → "milk") |
| `DELETE` | `/api/vocab/:id` | Removes custom vocabulary mapping |

### 📤 Export (`/api/export`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/export` | Generates and downloads CSV, JSON, or Tally XML file |
| `GET` | `/api/export/history` | Retrieves log of historical export packages |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Start Development Servers
```bash
npm run dev
# Launches Express API (port 3001) and Vite frontend (port 5173) concurrently
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔒 Security & Privacy Notice
- No bill image data or personal financial information is logged to server outputs.
- Passwords are encrypted with SHA-256 + cryptographic salts.
- API endpoints are protected by JWT Bearer authentication and rate-limited.
- Strict multi-tenant data isolation by `businessId`.
