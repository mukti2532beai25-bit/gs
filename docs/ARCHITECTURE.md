# BahiVerse AI — Architecture & Engineering Specification

## 1. System Overview
BahiVerse AI is an autonomous, AI-powered digital accounting assistant built specifically for small shopkeepers, general stores, and retail merchants. It solves the pain point of manual ledger bookkeeping ("bahi-khata") by processing handwritten and printed paper receipts through multi-lingual OCR, 3D normalization, phonetic dialect recognition, and human-in-the-loop review.

## 2. Monorepo Organization
```text
gs/
├── frontend/             # React 18 + Vite 5 + Tailwind + Three.js / R3F
│   ├── public/           # Static icons & branding assets
│   └── src/
│       ├── assets/       # Media & graphical textures
│       ├── components/   # Atomic UI primitives, forms, modals & layouts
│       ├── pages/        # 6 core modules
│       ├── three/        # Dedicated 3D WebGL scenes for all 6 pages
│       ├── hooks/        # Reactive hooks (Auth, Bills, Voice, Toast)
│       ├── services/     # Typed API clients & WebSocket connectors
│       ├── store/        # State store management
│       ├── types/        # Full domain type declarations
│       ├── utils/        # Monetary, string, formatting & blob helpers
│       └── styles/       # Tailwind tokens & glassmorphic shaders
├── backend/              # Express 4 + TypeScript + Prisma ORM
│   ├── prisma/           # PostgreSQL relational schema
│   └── src/
│       ├── config/       # Environment & database singletons
│       ├── controllers/  # Route controller handlers
│       ├── middleware/   # JWT verification & multi-tenant business auth
│       ├── routes/       # Express route definitions
│       ├── services/ai/  # Modular OCR, Voice, NLP, and Vocab engines
│       ├── validators/   # Strict Zod schemas
│       ├── utils/        # Bcrypt, JWT and formatting utils
│       └── types/        # Server-side TypeScript interfaces
├── docs/                 # Engineering architecture, DB and API docs
├── docker-compose.yml    # Local PostgreSQL container definition
├── package.json          # Monorepo script orchestrator
└── README.md             # Developer setup & product overview
```

## 3. 3D WebGL Design Language
The UI follows an **Obsidian, Smoked Quartz, Cyan Glow, and Emerald Mint** aesthetic:
- **Base Canvas:** Deep Carbon Obsidian (`#050816` to `#0A0F1E`).
- **Glassmorphism:** 1px specular micro-borders (`rgba(255,255,255,0.08)`) with `backdrop-blur-xl`.
- **Dynamic 3D Scenes:** Implemented with React Three Fiber (`@react-three/fiber`) and Drei (`@react-three/drei`), optimized for mobile framerates and equipped with 2D fallbacks.
