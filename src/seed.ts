import 'dotenv/config';
import { db } from './db';
import {
  branches,
  products,
  productBranchStock,
  customers,
  orders,
  orderItems,
  customerLedgerTransactions,
  tradeSchemes,
  teamMembers,
  attendanceRecords,
  deliveryRiders,
  notifications,
  branchNodes,
} from './schema';
import { INITIAL_PRODUCTS } from './components/Products/types';
import { FREQUENT_CUSTOMERS, BRANCHES } from './components/Counter/types';
import { INITIAL_ORDERS } from './components/Orders/types';
import { INITIAL_LEDGER_ACCOUNTS } from './components/Ledger/types';
import { INITIAL_TRADE_SCHEMES } from './components/TradeSchemes/types';
import { INITIAL_MEMBERS } from './components/Team/types';
import { INITIAL_ATTENDANCE_RECORDS } from './components/Attendance/types';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('--- Starting Neon Database Seeding ---');

  // 1. Seed Branches
  console.log('Seeding branches...');
  for (const b of BRANCHES) {
    await db
      .insert(branches)
      .values({
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        address: b.address,
        phone: b.phone,
        managerName: b.manager,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  // 2. Seed Products & Branch Stock
  console.log('Seeding products and branch stocks...');
  for (const p of INITIAL_PRODUCTS) {
    await db
      .insert(products)
      .values({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        listingType: p.type,
        bikeModel: p.bikeModel,
        costPrice: String(p.costPrice),
        retailPrice: String(Math.round(p.price * 1.15)),
        wholesalePrice: String(p.price),
        totalStock: p.totalStock,
        lowStockThreshold: p.lowStockThreshold,
        unit: p.unit,
        imageUrl: p.imageUrl || '/logo.png',
        status: p.status,
      })
      .onConflictDoNothing();

    // Insert 3 branch stocks for this product
    for (const bs of p.branches) {
      await db
        .insert(productBranchStock)
        .values({
          id: `pbs_${p.id}_${bs.branchId}`,
          productId: p.id,
          branchId: bs.branchId,
          stockQuantity: bs.stock,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Seed Customers
  console.log('Seeding customers...');
  for (const c of FREQUENT_CUSTOMERS) {
    const custId = c.id || `CUST-${Math.random().toString(36).substring(2, 6)}`;
    await db
      .insert(customers)
      .values({
        id: custId,
        name: c.name,
        phone: c.phone,
        city: c.city,
        route: c.route || 'Saddar Counter',
        salesman: c.salesman || 'Counter Cashier',
        customerType: c.type,
        paymentMethod: c.paymentMethod,
        openingBalance: String(c.openingBalance || 0),
        currentBalance: String(c.currentBalance || 0),
        creditLimit: String(c.creditLimit || 100000),
      })
      .onConflictDoNothing();
  }

  // 4. Seed Trade Schemes
  console.log('Seeding trade schemes...');
  for (const s of INITIAL_TRADE_SCHEMES) {
    await db
      .insert(tradeSchemes)
      .values({
        id: s.id,
        productId: s.productId,
        title: s.title,
        schemeType: s.schemeType,
        buyQuantity: s.buyQuantity,
        freeQuantity: s.freeQuantity,
        netSchemeRate: s.netSchemeRate ? String(s.netSchemeRate) : null,
        applicableTier: s.applicableTier,
        validFrom: new Date(s.validFrom),
        validTo: new Date(s.validTo),
        status: s.status,
        remarks: s.remarks,
      })
      .onConflictDoNothing();
  }

  // 5. Seed Orders & Order Items
  console.log('Seeding orders...');
  for (let orderIdx = 0; orderIdx < INITIAL_ORDERS.length; orderIdx++) {
    const o = INITIAL_ORDERS[orderIdx];
    // Find matching customer or default to CUST-002
    const cust = FREQUENT_CUSTOMERS.find((c) => c.name === o.customerName);
    const customerId = cust?.id || 'CUST-002';
    const invNum = o.invoiceNumber === 'SA-64276' && orderIdx > 0 ? 'SA-64277' : o.invoiceNumber;

    await db
      .insert(orders)
      .values({
        id: o.id,
        invoiceNumber: invNum,
        customerId: customerId,
        customerName: o.customerName,
        customerPhone: o.customerPhone || '0300-0000000',
        customerCity: o.customerCity,
        branchId: 'main',
        orderType: o.type,
        orderStatus: o.status,
        paymentMethod: o.paymentMethod,
        subtotalAmount: String(o.totalAmount),
        discountAmount: '0.00',
        shippingCharges: String(o.shippingCharges || 0),
        totalAmount: String(o.totalAmount),
        cashReceived: String(o.cashReceived || 0),
        changeReturned: '0.00',
        netBalanceAdded: String(o.finalBalance || 0),
        remarks: o.remarks,
        createdByUserId: null,
      })
      .onConflictDoNothing();

    for (let idx = 0; idx < o.items.length; idx++) {
      const it = o.items[idx];
      await db
        .insert(orderItems)
        .values({
          id: `item_${o.id}_${idx}`,
          orderId: o.id,
          productId: 'PRD-101', // Fallback product FK
          productName: it.name,
          sku: 'CRN-ITEM',
          bikeModel: 'Honda CD70',
          category: 'Engine & Transmission',
          unitRate: String(it.rate),
          pricingTier: o.type,
          isSchemeApplied: false,
          quantity: it.quantity,
          lineTotal: String(it.total),
        })
        .onConflictDoNothing();
    }
  }

  // 6. Seed Ledger Transactions
  console.log('Seeding ledger transactions...');
  for (const acc of INITIAL_LEDGER_ACCOUNTS) {
    for (const tx of acc.transactions) {
      await db
        .insert(customerLedgerTransactions)
        .values({
          id: tx.id,
          customerId: acc.id,
          voucherNumber: tx.voucherNo,
          transactionType: tx.type,
          description: tx.description,
          debitAmount: String(tx.debit),
          creditAmount: String(tx.credit),
          runningBalance: String(tx.balance),
          collectorName: tx.collectorOrCashier,
          transactionDate: new Date(tx.date),
        })
        .onConflictDoNothing();
    }
  }

  // 7. Seed Team Members
  console.log('Seeding team members...');
  for (const m of INITIAL_MEMBERS) {
    await db
      .insert(teamMembers)
      .values({
        id: m.id,
        name: m.name,
        role: m.role,
        email: m.email,
        phone: m.phone,
        branchId: m.branchId,
        avatarUrl: m.avatarUrl,
        status: m.status,
      })
      .onConflictDoNothing();
  }

  // 8. Seed Attendance
  console.log('Seeding attendance records...');
  for (const a of INITIAL_ATTENDANCE_RECORDS) {
    await db
      .insert(attendanceRecords)
      .values({
        id: a.id,
        employeeId: a.employeeId,
        branchId: a.branchId,
        attendanceDate: '2026-11-15',
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        shiftTiming: a.shiftTiming,
        overtimeHours: String(a.overtimeHours || 0),
        notes: a.notes,
      })
      .onConflictDoNothing();
  }

  // 9. Seed Delivery Riders
  console.log('Seeding delivery riders...');
  const initialRiders = [
    {
      id: 'RDR-001',
      name: 'Usman Ali (Saddar Express)',
      phone: '0302-1122334',
      vehicleNumber: 'KHI-7089',
      currentStatus: 'en_route_delivery',
      currentLatitude: '24.860600',
      currentLongitude: '67.001100',
    },
    {
      id: 'RDR-002',
      name: 'Farhan Khan (Gulshan Route)',
      phone: '0315-9988776',
      vehicleNumber: 'KHI-4421',
      currentStatus: 'idle',
      currentLatitude: '24.918000',
      currentLongitude: '67.097100',
    },
  ];
  for (const r of initialRiders) {
    await db.insert(deliveryRiders).values(r).onConflictDoNothing();
  }

  // 10. Seed Notifications
  console.log('Seeding notifications...');
  const notifs = [
    {
      id: 'NOTIF-101',
      title: 'Critical Low Stock: Crown CD70 Piston Kit',
      description: 'Only 8 kits remaining in Saddar Branch. Threshold is 15. Reorder suggested for peak weekend sales.',
      notificationType: 'stock',
      branchId: 'main',
      isRead: false,
      isUrgent: true,
      actionUrl: '/dashboard/products',
      actionLabel: 'Restock Part',
    },
    {
      id: 'NOTIF-102',
      title: 'New Wholesale Order Received (#SA-64276)',
      description: 'Dealer Afraz Auto Works created order for Rs. 36,000 via Counter Credit.',
      notificationType: 'orders',
      branchId: 'main',
      isRead: false,
      isUrgent: false,
      actionUrl: '/dashboard/orders',
      actionLabel: 'View Invoice',
    },
  ];
  for (const n of notifs) {
    await db.insert(notifications).values(n).onConflictDoNothing();
  }

  // 11. Seed Branch Nodes
  console.log('Seeding branch nodes...');
  const nodes = [
    {
      id: 'main',
      branchId: 'main',
      counterName: 'Saddar Head Office Main Terminal',
      ipAddress: '192.168.1.10',
      pingLatencyMs: 12,
      status: 'online',
      syncHealth: 'Fully Operational',
    },
    {
      id: 'branch-2',
      branchId: 'branch-2',
      counterName: 'Gulshan Branch Counter #1',
      ipAddress: '192.168.2.15',
      pingLatencyMs: 24,
      status: 'online',
      syncHealth: 'Fully Operational',
    },
    {
      id: 'branch-3',
      branchId: 'branch-3',
      counterName: 'DHA Express Counter #1',
      ipAddress: '192.168.3.22',
      pingLatencyMs: 18,
      status: 'online',
      syncHealth: 'Fully Operational',
    },
  ];
  for (const nd of nodes) {
    await db.insert(branchNodes).values(nd).onConflictDoNothing();
  }

  console.log('--- Seeding Completed Successfully! ---');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
