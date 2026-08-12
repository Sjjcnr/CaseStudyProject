# Known Limitations & Deliberate Scope Boundaries

## Fixed Scope Exclusions

By project specification and 48-hour scope design, the following features are **explicitly excluded**:

- **No AWS Services**: No AWS S3, EC2, or AWS SDK dependencies.
- **No Docker / Containerization**: No `Dockerfile` or `docker-compose.yml` files. Native hosting on Render and Vercel is used directly.
- **No GitHub Actions / CI Pipelines**: Deployments rely on native GitHub repository integration built into Vercel and Render.
- **No Invoices or PDF Export**: Challans and customer records are managed digitally within the web portal without PDF generation libraries.
- **No Purchase Orders Module**: Mentioned in general business context but omitted from project scope in favor of core CRM, inventory, and sales challans.
- **No Product Image Uploads**: Product catalog items store standard textual attributes, pricing, stock alerts, and locations without media hosting.

## Operational & Architectural Boundaries

1. **In-Memory JWT Storage**:
   - Access tokens reside purely in React application state to maximize security across cross-domain deployments (Vercel SPA -> Render API).
   - Refreshing the browser page resets the in-memory token state, requiring the user to re-authenticate by deliberate security design.
2. **Render Free-Tier Cold Starts**:
   - If hosted on Render's free tier, the web service enters a dormant state after 15 minutes of inactivity. Initial requests may take 30-50 seconds to spin up.
3. **Internal Single-Company Scope**:
   - The application does not support multi-organization tenant isolation or customizable role creation outside the 4 predefined system roles.
