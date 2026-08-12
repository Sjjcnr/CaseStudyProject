# System Architecture Document

## Overview

The **Mini ERP + CRM Operations Portal** is built using a modern decoupled client-server architecture designed for high responsiveness, secure role-based operation, and transactional data integrity across multi-domain cloud hosting providers (Vercel, Render, Supabase).

## Tech Stack Summary

- **Frontend**: React 18, TypeScript, Vite, React Router v6, CSS Design System (Hosted on Vercel).
- **Backend API**: Node.js, Express, TypeScript, Zod Validation, JWT Authentication (Hosted on Render Web Service).
- **Database Layer**: Supabase PostgreSQL managed via Prisma ORM v5 with version-controlled migrations.

## High-Level Component Diagram

```
+-------------------------------------------------------------------+
|                        FRONTEND (Vercel)                          |
|  React 18 SPA + React Router + In-Memory Auth Context             |
+-------------------------------------------------------------------+
                                  |
                                  | HTTPS (REST JSON + Bearer JWT)
                                  v
+-------------------------------------------------------------------+
|                     BACKEND API (Render)                          |
|  Express Server + Zod Validation + Role Middleware + Prisma ORM   |
+-------------------------------------------------------------------+
                                  |
                                  | PostgreSQL Connection (SSL)
                                  v
+-------------------------------------------------------------------+
|                     DATABASE (Supabase)                           |
|  PostgreSQL Database (Users, Customers, Products, Challans)       |
+-------------------------------------------------------------------+
```

## Data Flow & Authentication Model

1. **Client Request**: The React application renders UI components based on in-memory user role permissions (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
2. **Authentication Flow**:
   - The user authenticates via `POST /api/v1/auth/login`.
   - The backend verifies credentials using `bcrypt` password comparison.
   - Upon successful verification, the API issues a signed JWT token.
   - The React application retains this access token **strictly in React memory** (never written to `localStorage`, `sessionStorage`, or cookies).
3. **Protected Requests**:
   - Every protected REST request includes the header `Authorization: Bearer <accessToken>`.
   - Express `authenticateJWT` middleware decodes and validates the token signature.
   - Express `authorize(...roles)` middleware verifies server-side permissions before executing business logic.
4. **Transactional Database Operations**:
   - Operations modifying multi-entity state (e.g. Sales Challan confirmation and stock movements) execute inside interactive database transactions (`prisma.$transaction`).
   - If stock is insufficient for any product, the transaction rolls back cleanly and returns a structured `409 INSUFFICIENT_STOCK` error envelope.
