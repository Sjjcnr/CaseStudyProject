# Mini ERP + CRM Operations Portal

Production-quality 48-hour-scope **Mini ERP + CRM Operations Portal** with role-based authorization, customer CRM follow-up timelines, inventory management with stock movement audit logs, and transactional sales challan stock reduction.

---

## Submission Summary & Quick Links

- **GitHub Repository**: [https://github.com/Sjjcnr/CaseStudyProject](https://github.com/Sjjcnr/CaseStudyProject)
- **Deployed Frontend (Vercel)**: `https://mini-erp-crm.vercel.app` *(Update with real URL after Vercel deployment)*
- **Deployed Backend API (Render)**: `https://mini-erp-crm-api.onrender.com/api/v1` *(Update with real URL after Render deployment)*
- **API Health Check**: `https://mini-erp-crm-api.onrender.com/health`
- **Postman Collection**: Located in [`postman/mini-erp-crm.postman_collection.json`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/postman/mini-erp-crm.postman_collection.json)

---

## Test Accounts & Credentials

All test accounts are pre-seeded with the password: `Password@123`

| Role | Email | Password | Allowed Capabilities & Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@mini-erp.test` | `Password@123` | Full access to all CRM, products, stock adjustments, and sales challans. |
| 💼 **Sales** | `sales@mini-erp.test` | `Password@123` | Manage customers & follow-up notes, view catalog, create/edit/confirm sales challans. Cannot manually adjust stock. |
| 📦 **Warehouse**| `warehouse@mini-erp.test`| `Password@123` | Manage products catalog, perform manual stock IN/OUT adjustments, view movement logs. Read-only customers/challans. |
| 📊 **Accounts** | `accounts@mini-erp.test` | `Password@123` | Read-only access to customers, products, stock movement logs, and sales challans. |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6, Lucide Icons, Custom Corporate CSS Design System.
- **Backend API**: Node.js, Express, TypeScript, Zod Validation, JWT Bearer Token Authentication, bcryptjs.
- **Database & ORM**: Supabase PostgreSQL, Prisma ORM v5 with version-controlled migrations and TypeScript seed script.
- **Hosting Targets**: Vercel (Frontend SPA), Render Web Service (Backend Node.js API), Supabase (PostgreSQL Database).

---

## Core Features & Modules

### 1. Authentication & Security
- Bearer-token JWT authentication flow across domains.
- Access tokens stored **strictly in React memory** (never in `localStorage`, `sessionStorage`, or cookies).
- Server-side role-based authorization middlewares (`401 Unauthorized` and `403 Forbidden`).
- Generic failure messages without exposing stack traces.

### 2. Customer CRM
- Complete customer profile management (Contact, Business Name, Type, Status, GST, Address).
- Paginated customer list with multi-field search (Name, Business, Mobile, Email) and filters (Status, Type).
- Separate `CustomerFollowUp` timeline tracking historical interaction notes with staff author and timestamp.

### 3. Inventory & Stock Movements
- Product catalog management with unique SKU validation, category, price, rack location, and stock alert levels.
- Low-stock filter identifying items where `currentStock <= minStockAlert`.
- Manual stock IN/OUT adjustment modal for Admin and Warehouse roles.
- Non-negative stock rule enforced on all adjustments.
- Complete `StockMovement` audit logs tracking timestamp, product, quantity change, movement type, reason, user, and linked challan.

### 4. Sales Delivery Challans & Transactions
- Auto-generated unique challan numbers (`CH-YYYY-XXXX`).
- Line items store immutable product snapshots (`productName`, `sku`, `unitPrice`, `quantity`).
- **Transactional Stock Reduction**: Confirming a draft challan reduces product stock and creates `OUT` stock movement records inside a single database transaction (`prisma.$transaction`).
- **Atomic Insufficient Stock Prevention**: If stock for any product is insufficient, the transaction rolls back cleanly, returns a structured HTTP `409 INSUFFICIENT_STOCK` error, and leaves database stock unchanged.
- **Challan Cancellation**: Cancelling a confirmed challan restores product stock through `IN` stock movement logs.

---

## Folder Structure

```
CaseStudyProject/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── prisma/
│   │   ├── migrations/       # Version-controlled PostgreSQL SQL migrations
│   │   ├── schema.prisma     # Prisma schema definition
│   │   └── seed.ts           # Demo seed script for users, customers, products, challans
│   ├── src/
│   │   ├── config/           # Environment configuration & Zod env parser
│   │   ├── lib/              # PrismaClient singleton instance
│   │   ├── middlewares/      # Auth, Zod validation, and error handling middlewares
│   │   ├── routes/           # Auth, Customer, Product, Challan API routes
│   │   ├── utils/            # Standard JSON response helpers
│   │   ├── app.ts            # Express application setup & CORS configuration
│   │   └── server.ts         # HTTP server listener (0.0.0.0:PORT)
│   ├── run-prisma.js         # Cross-platform Prisma env loader helper
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/              # Fetch API client with Bearer token header unwrapping
│   │   ├── components/       # Layout (Header, Sidebar) & Common UI components (Badge, Alert, Pagination)
│   │   ├── context/          # In-memory JWT AuthContext
│   │   ├── pages/            # Login, Dashboard, Customers, Products, Challans, Error pages
│   │   ├── types/            # TypeScript interface definitions
│   │   ├── App.tsx           # React Router configuration & role guards
│   │   ├── index.css         # Modern corporate CSS design system
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Complete Technical Documentation
│   ├── architecture.md       # Architecture overview & data flow diagrams
│   ├── server-setup.md       # Express setup, middleware, health check
│   ├── environment-variables.md # Comprehensive environment variables matrix
│   ├── local-development.md  # Local setup & running instructions
│   ├── deployment.md         # Deployment guide for Supabase, Render, Vercel
│   ├── assumptions.md        # Role permission matrix & business assumptions
│   ├── known-limitations.md  # Explicit scope boundaries & trade-offs
│   ├── api.md                # Complete REST API specification
│   └── demo-recording-script.md # Video demo recording checklist
├── postman/
│   └── mini-erp-crm.postman_collection.json # Postman collection with auto-token script
├── README.md                 # Primary Documentation Landing Page
└── .gitignore
```

---

## Local Setup & Quick Start Commands

### Prerequisites
- Node.js v18+ and npm installed.
- Root `.env` containing Supabase credentials.

### 1. Backend Setup & Database Migration
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
Backend API will start at: `http://localhost:4000` (Health check: `http://localhost:4000/health`).

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Portal will start at: `http://localhost:5173`.

---

## Comprehensive Project Documentation Index

Explore detailed technical documentation in the [`docs/`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs) directory:

1. [📖 `docs/architecture.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/architecture.md) — System Architecture & Data Flow Diagram.
2. [⚙️ `docs/server-setup.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/server-setup.md) — Express Server Configuration & Middleware Pipeline.
3. [🔑 `docs/environment-variables.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/environment-variables.md) — Complete Environment Variables Table.
4. [💻 `docs/local-development.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/local-development.md) — Local Development & Troubleshooting Guide.
5. [🚀 `docs/deployment.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/deployment.md) — Deployment Guide for Supabase, Render, and Vercel.
6. [📋 `docs/assumptions.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/assumptions.md) — Role Permissions Matrix & Business Assumptions.
7. [⚠️ `docs/known-limitations.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/known-limitations.md) — Scope Boundaries & Technical Boundaries.
8. [🔌 `docs/api.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/api.md) — Full REST API Reference & JSON Schema Envelopes.
9. [🎬 `docs/demo-recording-script.md`](file:///c:/Users/91638/OneDrive/Desktop/Antigravity/Case%20study%20Project/docs/demo-recording-script.md) — 5-Minute Video Recording Walkthrough Checklist.
