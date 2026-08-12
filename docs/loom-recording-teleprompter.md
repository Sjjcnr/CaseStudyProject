# Loom Video Recording Teleprompter & Step-by-Step Guide

This guide contains the **exact script to read out loud** alongside the **exact screen actions to perform** during your 4-minute Loom video recording.

---

## Recording Summary Checklist

- **Target Duration**: 4 Minutes (Safely within Loom's 5-minute free tier).
- **Tab 1**: Live Frontend — `https://frontend-six-psi-93.vercel.app`
- **Tab 2**: Live Backend Health — `https://mini-erp-backend-0s28.onrender.com/health`
- **Tab 3**: GitHub Repo — `https://github.com/Sjjcnr/CaseStudyProject`

---

## Teleprompter & Screen Action Table

| Time | Screen Action (What to click/do) | Script to Read Out Loud (What to say) |
| :--- | :--- | :--- |
| **0:00 - 0:45** | **1.** Start Loom recording.<br>**2.** Show Tab 1 (`https://frontend-six-psi-93.vercel.app`).<br>**3.** Switch to Tab 2 (`https://mini-erp-backend-0s28.onrender.com/health`). | *"Hello! This is my submission for the Fundsroom Infotech Technical Case Study — the Mini ERP + CRM Operations Portal. The full-stack app is built with React 18, TypeScript, Express, Prisma ORM, and Supabase PostgreSQL. Here you can see our live backend API health check endpoint on Render returning status OK, connected to our Supabase database."* |
| **0:45 - 1:45** | **1.** Switch to Tab 1.<br>**2.** Click 1-Click **Admin** button (`admin@mini-erp.test`) and click **Sign In**.<br>**3.** Hover over Dashboard KPI cards.<br>**4.** Click **Customer CRM** -> Type `Acme` -> Click **View Details**.<br>**5.** Click **Add Follow-Up Note**, type *"Scheduled Q3 product demo call"*, click Save. | *"Let's log in using our pre-seeded Admin credentials. The main Operations Dashboard displays real-time KPI metrics, low-stock warnings, and sales challan summaries. Next, navigating to the Customer CRM module, we have paginated search and status filters. Clicking into a customer detail page opens an interactive timeline where staff can log interaction follow-up notes with author tracking and timestamps."* |
| **1:45 - 2:45** | **1.** Click **Logout** at top right.<br>**2.** Click 1-Click **Warehouse** preset (`warehouse@mini-erp.test`) and log in.<br>**3.** Click **Products Inventory** on sidebar.<br>**4.** Click **Adjust Stock** on product `MOU-ERG-003`.<br>**5.** Select **IN**, enter quantity **20**, reason *"Received supplier shipment"*, click Submit.<br>**6.** Click **Stock Movements** on sidebar. | *"Now logging out and logging in as the Warehouse manager. Notice that the Warehouse role has product catalog and stock adjustment permissions, but read-only access to customer CRM data. Let's perform a manual stock IN adjustment of 20 units for our Ergonomic Mouse. Once submitted, current stock updates instantly and a permanent audit log entry is recorded under Stock Movements with author and timestamp details."* |
| **2:45 - 4:00** | **1.** Click **Logout**.<br>**2.** Click 1-Click **Sales** preset (`sales@mini-erp.test`) and log in.<br>**3.** Click **Sales Challans** -> **+ Create Sales Challan**.<br>**4.** Select customer `Acme` and add product `UltraWide Monitor`.<br>**5.** Set quantity to `999` and click **Confirm Challan**.<br>**6.** Point to the red **409 INSUFFICIENT_STOCK** error alert banner.<br>**7.** Change quantity to `2` units and click **Confirm Challan**. | *"Next, signing in under the Sales role. Let's create a new Sales Delivery Challan. When creating a challan, line items store immutable product snapshots. If a user attempts to confirm a quantity exceeding available stock, our backend transaction cleanly rolls back and returns a 409 INSUFFICIENT_STOCK error without altering inventory. Lowering the quantity to 2 units and confirming executes an atomic database transaction that reduces stock and logs an OUT movement."* |
| **4:00 - 4:30** | **1.** Switch to Tab 3 (`https://github.com/Sjjcnr/CaseStudyProject`).<br>**2.** Scroll over `README.md` and `docs/` folder.<br>**3.** Stop Loom recording! | *"Finally, all source code, Prisma migrations, Postman collections, and detailed architectural documentation are pushed to our GitHub repository. Thank you for your time and consideration!"* |

---

## Quick Reference Test Passwords

All accounts use: **`Password@123`**

- 👑 **Admin**: `admin@mini-erp.test`
- 💼 **Sales**: `sales@mini-erp.test`
- 📦 **Warehouse**: `warehouse@mini-erp.test`
- 📊 **Accounts**: `accounts@mini-erp.test`
