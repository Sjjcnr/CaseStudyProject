import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root or backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data (reverse dependency order)
  await prisma.challanItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mini-erp.test',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: 'sales@mini-erp.test',
      passwordHash,
      name: 'Sarah Sales',
      role: Role.SALES,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      email: 'warehouse@mini-erp.test',
      passwordHash,
      name: 'Wally Warehouse',
      role: Role.WAREHOUSE,
    },
  });

  const accounts = await prisma.user.create({
    data: {
      email: 'accounts@mini-erp.test',
      passwordHash,
      name: 'Alex Accounts',
      role: Role.ACCOUNTS,
    },
  });

  console.log('Seeded Users:', [admin.email, sales.email, warehouse.email, accounts.email]);

  // 4. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Logistics',
      mobile: '+1-555-0192',
      email: 'contact@acmelogistics.com',
      businessName: 'Acme Logistics Pvt Ltd',
      gstNumber: '29ABCDE1234F1Z5',
      type: CustomerType.DISTRIBUTOR,
      address: '100 Industrial Park, Suite 4A, Chicago IL',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      notes: 'Key distributor interested in bulk computer peripherals.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'TechMart Retail',
      mobile: '+1-555-0144',
      email: 'procurement@techmart.com',
      businessName: 'TechMart Electronics Ltd',
      gstNumber: '27AAACB9876G1Z2',
      type: CustomerType.WHOLESALE,
      address: '45 Commercial Street, Boston MA',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 86400000 * 7),
      notes: 'Monthly recurring wholesale buyer.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      mobile: '+1-555-0188',
      email: 'john.doe@gmail.com',
      businessName: 'Doe Freelance Design',
      gstNumber: null,
      type: CustomerType.RETAIL,
      address: '12 Sunshine Apartments, Austin TX',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 86400000 * 1),
      notes: 'Inquired about ergonomic keyboards and monitors.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Global Solutions',
      mobile: '+1-555-0133',
      email: 'info@globalsolutions.io',
      businessName: 'Global Solutions Inc',
      gstNumber: '33XYZAB4567H1Z9',
      type: CustomerType.DISTRIBUTOR,
      address: '88 Tech Boulevard, Seattle WA',
      status: CustomerStatus.INACTIVE,
      followUpDate: null,
      notes: 'Inactive account - contract ended last quarter.',
    },
  });

  // 5. Create Customer Follow-ups
  await prisma.customerFollowUp.createMany({
    data: [
      {
        customerId: customer1.id,
        note: 'Initial intro call completed. Shared product catalog and wholesale price list.',
        authorId: sales.id,
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        customerId: customer1.id,
        note: 'Followed up on quote for 50x Monitors. Client requested revised discount.',
        authorId: sales.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        customerId: customer3.id,
        note: 'Customer called asking for demo of Mechanical Keyboard.',
        authorId: sales.id,
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  // 6. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'UltraWide Monitor 34-inch',
      sku: 'MON-UW34-001',
      category: 'Monitors',
      unitPrice: 450.00,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Rack A-12',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Mechanical RGB Keyboard',
      sku: 'KEY-MECH-002',
      category: 'Peripherals',
      unitPrice: 85.50,
      currentStock: 120,
      minStockAlert: 20,
      location: 'Rack B-04',
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Ergonomic Wireless Mouse',
      sku: 'MOU-ERG-003',
      category: 'Peripherals',
      unitPrice: 45.00,
      currentStock: 4, // LOW STOCK ALERT
      minStockAlert: 15,
      location: 'Rack B-05',
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'USB-C Docking Station 11-in-1',
      sku: 'DOC-USBC-004',
      category: 'Accessories',
      unitPrice: 120.00,
      currentStock: 2, // LOW STOCK ALERT
      minStockAlert: 10,
      location: 'Rack C-01',
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Noise-Cancelling Headset',
      sku: 'HEAD-NC-005',
      category: 'Audio',
      unitPrice: 150.00,
      currentStock: 30,
      minStockAlert: 5,
      location: 'Rack D-03',
    },
  });

  console.log('Seeded Products:', [p1.sku, p2.sku, p3.sku, p4.sku, p5.sku]);

  // 7. Create Initial Stock Movements (IN)
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: p1.id,
        quantityChanged: 50,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdById: warehouse.id,
      },
      {
        productId: p2.id,
        quantityChanged: 150,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdById: warehouse.id,
      },
      {
        productId: p3.id,
        quantityChanged: 20,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdById: warehouse.id,
      },
      {
        productId: p4.id,
        quantityChanged: 10,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdById: warehouse.id,
      },
      {
        productId: p5.id,
        quantityChanged: 35,
        movementType: MovementType.IN,
        reason: 'Initial inventory load',
        createdById: warehouse.id,
      },
    ],
  });

  // 8. Create Sales Challans
  // Challan 1: Confirmed
  const challanConfirmed = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 2250.00,
      status: ChallanStatus.CONFIRMED,
      createdById: sales.id,
      confirmedAt: new Date(Date.now() - 86400000 * 1),
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            sku: p1.sku,
            unitPrice: p1.unitPrice,
            quantity: 5,
          },
        ],
      },
    },
  });

  // Stock movement for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: p1.id,
      quantityChanged: 5,
      movementType: MovementType.OUT,
      reason: `Challan ${challanConfirmed.challanNumber} Confirmed`,
      createdById: sales.id,
      challanId: challanConfirmed.id,
    },
  });

  // Challan 2: Draft
  const challanDraft = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: customer2.id,
      totalQuantity: 30,
      totalAmount: 2565.00,
      status: ChallanStatus.DRAFT,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            sku: p2.sku,
            unitPrice: p2.unitPrice,
            quantity: 30,
          },
        ],
      },
    },
  });

  console.log('Seeded Challans:', [challanConfirmed.challanNumber, challanDraft.challanNumber]);
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
