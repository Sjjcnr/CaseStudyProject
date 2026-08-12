# REST API Reference Specification

All endpoints are prefixed with `/api/v1` unless noted otherwise (e.g. `/health`).

## Standard Response Format

### Success Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product 'Ergonomic Wireless Mouse' (MOU-ERG-003). Available stock: 4, Requested: 10",
    "details": []
  }
}
```

## Standard HTTP Status Codes

- `200 OK`: Successful fetch / update / confirm operation.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed JSON input.
- `401 Unauthorized`: Missing or invalid Bearer token.
- `403 Forbidden`: Authenticated user lacks required role permission.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business state conflict (e.g., insufficient inventory stock or duplicate SKU).
- `500 Internal Server Error`: Unexpected runtime exception.

---

## Endpoint Specification

### 1. Health Check
- `GET /health` (Unauthenticated)

### 2. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` (Unauthenticated)
  - Body: `{ email, password }`
  - Returns: `{ accessToken, user: { id, email, name, role } }`
- `POST /api/v1/auth/logout` (Bearer Token)
- `GET /api/v1/auth/me` (Bearer Token)

### 3. Customers CRM (`/api/v1/customers`)
- `GET /api/v1/customers?page=1&limit=10&q=acme&status=ACTIVE&type=DISTRIBUTOR` (All Roles)
- `POST /api/v1/customers` (Admin, Sales)
  - Body: `{ name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes }`
- `GET /api/v1/customers/:id` (All Roles)
- `PATCH /api/v1/customers/:id` (Admin, Sales)
- `GET /api/v1/customers/:id/follow-ups` (All Roles)
- `POST /api/v1/customers/:id/follow-ups` (Admin, Sales)
  - Body: `{ note }`

### 4. Products & Inventory (`/api/v1/products`)
- `GET /api/v1/products?page=1&limit=10&q=keyboard&lowStock=true` (All Roles)
- `POST /api/v1/products` (Admin, Warehouse)
  - Body: `{ name, sku, category, unitPrice, currentStock, minStockAlert, location }`
- `GET /api/v1/products/:id` (All Roles)
- `PATCH /api/v1/products/:id` (Admin, Warehouse)
- `GET /api/v1/products/:id/stock-movements` (All Roles)
- `POST /api/v1/products/:id/stock-movements` (Admin, Warehouse - Manual Adjustment)
  - Body: `{ quantityChanged, movementType: "IN"|"OUT", reason }`

### 5. Sales Delivery Challans (`/api/v1/challans`)
- `GET /api/v1/challans?page=1&limit=10&status=DRAFT&customerId=uuid` (All Roles)
- `POST /api/v1/challans` (Admin, Sales)
  - Body: `{ customerId, status: "DRAFT"|"CONFIRMED", items: [{ productId, quantity }] }`
- `GET /api/v1/challans/:id` (All Roles)
- `PATCH /api/v1/challans/:id` (Admin, Sales - Draft Editable Only)
- `POST /api/v1/challans/:id/confirm` (Admin, Sales - Transactional Stock Reduction)
- `POST /api/v1/challans/:id/cancel` (Admin, Sales - Stock Restoration)
