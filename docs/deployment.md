# Deployment Guide (Supabase, Render, Vercel)

This document provides step-by-step instructions for deploying the Mini ERP + CRM Operations Portal to production using Supabase PostgreSQL, Render Web Service, and Vercel SPA Hosting.

## 1. Database Deployment (Supabase)

1. **Database Schema Sync**:
   - Do NOT rely on automatic GitHub sync. Run committed Prisma migrations against the production Supabase database before serving production API traffic:
   ```bash
   cd backend
   DATABASE_URL="your-production-supabase-url" npx prisma migrate deploy
   ```
2. **Seed Initial Production / Demo Data** (Run Once):
   ```bash
   DATABASE_URL="your-production-supabase-url" npx ts-node prisma/seed.ts
   ```

> [!CAUTION]
> Never run `prisma migrate reset` or destructive table commands on a production Supabase project.

---

## 2. Backend Deployment (Render Web Service)

1. Sign in to [Render Dashboard](https://dashboard.render.com/) and click **New + -> Web Service**.
2. Connect your GitHub repository `https://github.com/Sjjcnr/CaseStudyProject`.
3. Configure service settings:
   - **Name**: `mini-erp-crm-backend`
   - **Region**: Select your preferred region (e.g. Oregon / Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Environment Variables:
   - Add `NODE_ENV` = `production`
   - Add `DATABASE_URL` = `<your-supabase-connection-string>`
   - Add `JWT_SECRET` = `<your-64-char-secure-secret>`
   - Add `CORS_ORIGIN` = `https://YOUR-FRONTEND.vercel.app`
5. Click **Create Web Service**. Wait for Render to build and deploy. Copy the deployed API URL (e.g. `https://mini-erp-crm-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. Sign in to [Vercel Dashboard](https://vercel.com/) and click **Add New -> Project**.
2. Import repository `Sjjcnr/CaseStudyProject`.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - Add `VITE_API_BASE_URL` = `https://mini-erp-crm-api.onrender.com/api/v1`
5. Click **Deploy**. Vercel will build and publish your static Single Page Application. Copy your Vercel URL (e.g. `https://mini-erp-crm.vercel.app`).

---

## 4. Post-Deployment CORS Update & Verification

1. Go back to Render Dashboard -> `mini-erp-crm-backend` -> Environment.
2. Update `CORS_ORIGIN` to match your real Vercel URL: `https://mini-erp-crm.vercel.app`.
3. Save changes (Render will automatically restart the web service).
4. Verify backend health check in browser: `https://mini-erp-crm-api.onrender.com/health`.
5. Open your Vercel URL in browser and test login with `admin@mini-erp.test` / `Password@123`.
