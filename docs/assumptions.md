# Business & Operational Assumptions Document

## Role Permissions Matrix

The portal implements strict role-based access control (RBAC) enforced on both server-side Express controllers and client-side React UI navigation.

| Feature / Action | Admin | Sales | Warehouse | Accounts |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & User Profile** | ✅ | ✅ | ✅ | ✅ |
| **View Dashboard Statistics** | ✅ | ✅ | ✅ | ✅ |
| **View Customers & Timeline** | ✅ | ✅ | ✅ | ✅ (Read-Only) |
| **Create & Edit Customers** | ✅ | ✅ | ❌ (403) | ❌ (403) |
| **Add Follow-Up Notes** | ✅ | ✅ | ❌ (403) | ❌ (403) |
| **View Products & Stock Levels** | ✅ | ✅ (Read-Only) | ✅ | ✅ (Read-Only) |
| **Create & Edit Products** | ✅ | ❌ (403) | ✅ | ❌ (403) |
| **Manual Stock IN/OUT Adjustment** | ✅ | ❌ (403) | ✅ | ❌ (403) |
| **View Stock Movement History** | ✅ | ✅ (Read-Only) | ✅ | ✅ (Read-Only) |
| **View Sales Delivery Challans** | ✅ | ✅ | ✅ (Read-Only) | ✅ (Read-Only) |
| **Create Draft & Confirmed Challan**| ✅ | ✅ | ❌ (403) | ❌ (403) |
| **Edit Draft Challan** | ✅ | ✅ | ❌ (403) | ❌ (403) |
| **Confirm Sales Challan** | ✅ | ✅ | ❌ (403) | ❌ (403) |
| **Cancel Confirmed Challan** | ✅ | ✅ | ❌ (403) | ❌ (403) |

## Operational Assumptions

1. **Single-Company Operations**: The application is designed for internal single-company operations (not multi-tenant SaaS). All users belong to the same enterprise.
2. **Sales Challan Cancellation**:
   - Cancelling a `CONFIRMED` sales challan restores product stock to the inventory.
   - Restored stock is automatically logged as an `IN` stock movement record with reason `Challan <Number> Cancelled (Stock Restored)` to preserve full auditability.
3. **Immutable Item Snapshots**:
   - When a sales challan is created, line items capture immutable snapshots of `productName`, `sku`, and `unitPrice` at the time of creation. Subsequent price or name changes in the product catalog do not retroactively alter existing challans.
4. **No Direct Client Database Access**:
   - All client interactions pass exclusively through the Express REST API. Supabase database keys are kept backend-only.
