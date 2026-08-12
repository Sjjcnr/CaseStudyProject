# Environment Variables Document

## Security Policy

> [!IMPORTANT]
> All real environment variables, secret keys, and database credentials MUST be stored in untracked `.env` files locally or within hosting provider settings (Vercel & Render dashboards). `.env` files are excluded from Git via `.gitignore` and MUST NEVER be committed to the repository.

## Environment Variables Matrix

| Component | Variable Name | Required | Default / Example Value | Description / Purpose | Secret? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend** | `NODE_ENV` | Yes | `development` / `production` | Execution environment mode. | No |
| **Backend** | `PORT` | Yes | `4000` | HTTP listening port for Express server. | No |
| **Backend** | `DATABASE_URL` | Yes | `postgresql://USER:PASS@HOST:5432/postgres` | PostgreSQL connection string for Supabase DB. | **YES** |
| **Backend** | `JWT_SECRET` | Yes | `replace-with-long-random-string` | Secret key used to sign and verify JWT tokens. | **YES** |
| **Backend** | `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed frontend origin URL for CORS policy. | No |
| **Frontend** | `VITE_API_BASE_URL` | Yes | `http://localhost:4000/api/v1` | Public API base URL used by React fetch client. | No |

## Hosting Provider Environment Settings

### 1. Render (Backend Web Service)
Set the following environment variables in **Render Dashboard -> Service -> Environment**:
- `NODE_ENV`: `production`
- `PORT`: `10000` (or leave default assigned by Render)
- `DATABASE_URL`: Your Supabase PostgreSQL Connection String
- `JWT_SECRET`: A secure 64-character random string
- `CORS_ORIGIN`: Your deployed Vercel frontend URL (e.g. `https://mini-erp-crm.vercel.app`)

### 2. Vercel (Frontend SPA)
Set the following environment variable in **Vercel Dashboard -> Settings -> Environment Variables**:
- `VITE_API_BASE_URL`: Your deployed Render API URL (e.g. `https://mini-erp-crm-api.onrender.com/api/v1`)

> [!NOTE]
> Changing `VITE_API_BASE_URL` on Vercel requires triggering a new build/redeploy for the change to embed into the client bundle.
