# Local Development Guide

## Prerequisites

- **Node.js**: v18.x or v20.x installed
- **npm**: v9.x or higher
- **Supabase Account / Credentials**: Local `.env` containing database connection parameters

## Step-by-Step Local Setup

### 1. Repository Setup & Environment Configuration

Make sure your root directory contains the local `.env` file with Supabase credentials.

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### 2. Backend Setup & Database Migration

Navigate to `/backend`:
```bash
cd backend
npm install
```

Run Prisma database migration to apply schema to Supabase:
```bash
npm run db:migrate
```

Run seed script to populate test accounts, demo customers, products, and challans:
```bash
npm run db:seed
```

Start backend development server:
```bash
npm run dev
```
Backend will start on `http://localhost:4000`. Test health check: `http://localhost:4000/health`.

### 3. Frontend Setup

In a new terminal, navigate to `/frontend`:
```bash
cd frontend
npm install
npm run dev
```
Frontend application will start on `http://localhost:5173`.

## Test User Login Credentials

All test accounts use the password: `Password@123`

| Role | Email | Permissions Overview |
| :--- | :--- | :--- |
| **Admin** | `admin@mini-erp.test` | Full access to all modules, products, stock adjustments, and challans. |
| **Sales** | `sales@mini-erp.test` | Customer CRM & follow-ups, view products, create/edit/confirm sales challans. Cannot adjust stock. |
| **Warehouse** | `warehouse@mini-erp.test` | Manage products catalog, manual stock IN/OUT adjustments, movement logs. Read customers/challans. |
| **Accounts** | `accounts@mini-erp.test` | Read-only access to customers, products, stock movement logs, and challans. |

## Troubleshooting Common Issues

### 1. Database Connection Errors (`P1001` / `P1000`)
- Verify your Supabase PostgreSQL connection string in `.env`.
- Ensure SSL mode is enabled (`sslmode=require`) in `DATABASE_URL`.

### 2. CORS Errors in Browser Console
- Check backend `CORS_ORIGIN` setting matches your frontend URL (`http://localhost:5173`).
- Ensure backend server is running and responding on port 4000.
