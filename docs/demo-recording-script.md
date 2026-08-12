# Demo Video Recording Script & Checklist

Use this structured 5-minute video walkthrough checklist when recording your submission video.

## Video Demonstration Walkthrough Checklist

### 1. Introduction & Health Check (0:00 - 0:45)
- [ ] Open browser to the deployed Vercel Frontend URL.
- [ ] Open a separate tab to `https://YOUR-RENDER-API.onrender.com/health` demonstrating live backend status.
- [ ] Highlight the clean corporate admin interface and role authentication setup.

### 2. Role 1: Admin Login & Full Access (0:45 - 1:30)
- [ ] Click 1-Click **Admin** Preset (`admin@mini-erp.test` / `Password@123`) and log in.
- [ ] Show Dashboard KPI cards: Total Customers, Active Customers, Products, Low Stock Alerts, Draft & Confirmed Challans.
- [ ] Navigate to **Customers CRM** -> show search filter & customer timeline view.
- [ ] Navigate to **Products Inventory** -> show catalog table with low stock badges.

### 3. Role 2: Warehouse Role & Stock Adjustment (1:30 - 2:30)
- [ ] Logout and sign in as **Warehouse** (`warehouse@mini-erp.test`).
- [ ] Show that Warehouse can view products and adjust stock, but cannot create customer follow-ups or sales challans.
- [ ] Click **Adjust Stock** on a product (e.g. `MOU-ERG-003`).
- [ ] Perform a **Stock IN** adjustment (+20 units) with reason `Received supplier PO-991`.
- [ ] Show updated current stock level in table.
- [ ] Navigate to **Stock Movements** -> verify the newly logged `IN` movement entry with user name and timestamp.

### 4. Role 3: Sales Role, Draft Challan & Transactional Confirm (2:30 - 4:00)
- [ ] Logout and sign in as **Sales** (`sales@mini-erp.test`).
- [ ] Navigate to **Sales Challans** -> click **Create Sales Challan**.
- [ ] Select customer `Acme Logistics` and add products.
- [ ] **Test Insufficient Stock Validation**: Select quantity exceeding available stock (e.g. 999 units) and click **Confirm Challan**.
- [ ] Point out the red **409 INSUFFICIENT_STOCK** error banner explaining that stock was not modified and transaction rolled back cleanly.
- [ ] Adjust quantity to valid amount (e.g. 2 units) and click **Save & CONFIRM**.
- [ ] Show successful confirmation status, reduced product stock, and `OUT` stock movement log.

### 5. Role 4: Accounts Read-Only Access & Challan Cancel (4:00 - 5:00)
- [ ] Sign in as **Accounts** (`accounts@mini-erp.test`).
- [ ] Show that Accounts has read-only visibility across customers, products, movements, and challans without write action buttons.
- [ ] Switch back to **Sales** / **Admin** role -> open the confirmed challan -> click **Cancel Challan**.
- [ ] Verify status updates to `CANCELLED` and product stock is restored via an `IN` stock movement record.
