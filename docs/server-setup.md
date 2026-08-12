# Server Setup & Configuration Document

## Node.js & Express Setup

The backend server is implemented in TypeScript running on Node.js. It follows a modular architecture separating configuration, route controllers, validation schemas, and database access.

### Key Middleware Stack

1. **`cors()`**: Restricts origins to `CORS_ORIGIN` (e.g. `http://localhost:5173` or Vercel URL), explicitly allowing `Authorization` and `Content-Type` headers. Wildcards (`*`) are disallowed in production configuration.
2. **`express.json()`**: Parses incoming JSON request payloads.
3. **`validateRequest()`**: Intercepts requests and enforces strict Zod schema validation against `req.body`, `req.query`, and `req.params`. Returns formatted `400 BAD_REQUEST` errors on validation failures.
4. **`authenticateJWT`**: Extracts and validates the Bearer token from the `Authorization` header. Attaches decoded user payload (`req.user`) to Express request context.
5. **`authorize(...roles)`**: Verifies if `req.user.role` matches allowed roles for the endpoint. Returns `403 FORBIDDEN` if unauthorized.
6. **`globalErrorHandler`**: Catches all unhandled server exceptions and Prisma errors, standardizing error outputs to `{ success: false, error: { code, message, details } }`. Stack traces are suppressed in production mode.

## Health Check Endpoint

- **Route**: `GET /health`
- **Authentication**: Unauthenticated
- **Purpose**: Uptime check for Render Web Service load balancers and deployment monitoring.
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "mini-erp-crm-backend",
      "timestamp": "2026-08-11T22:15:00.000Z"
    }
  }
  ```

## Server Binding

The Express HTTP server binds explicitly to `0.0.0.0` and `process.env.PORT` to satisfy Render Web Service dynamic port mapping requirements.

```typescript
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
```
