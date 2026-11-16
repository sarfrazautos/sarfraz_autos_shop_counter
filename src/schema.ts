import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  numeric,
  integer,
  date,
  varchar,
  serial,
} from 'drizzle-orm/pg-core';

// --------------------------------------------------------------------------
// 1. RE-EXPORT BETTER AUTH TABLES & DEMO TABLE
// --------------------------------------------------------------------------
export * from './auth-schema';

export const demoUsers = pgTable('demo_users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --------------------------------------------------------------------------
// 2. MULTI-BRANCH CONFIGURATION
// --------------------------------------------------------------------------
export const branches = pgTable('branches', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'main', 'branch-2', 'branch-3'
  name: varchar('name', { length: 255 }).notNull(),
  shortName: varchar('short_name', { length: 100 }).notNull(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  managerName: varchar('manager_name', { length: 150 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --------------------------------------------------------------------------
// 3. PRODUCTS & INVENTORY MANAGEMENT
// --------------------------------------------------------------------------
export const products = pgTable(
  'products',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // 'PRD-101'
    sku: varchar('sku', { length: 100 }).notNull().unique(), // 'CRN-CD70-PST'
    name: varchar('name', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 100 }).default('Crown').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    listingType: varchar('listing_type', { length: 30 }).default('Wholesale').notNull(), // 'Wholesale' | 'Retail' | 'Both'
    bikeModel: varchar('bike_model', { length: 100 }).notNull(),
    costPrice: numeric('cost_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
    retailPrice: numeric('retail_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
    wholesalePrice: numeric('wholesale_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
    totalStock: integer('total_stock').default(0).notNull(),
    lowStockThreshold: integer('low_stock_threshold').default(15).notNull(),
    unit: varchar('unit', { length: 30 }).default('Pcs').notNull(),
    imageUrl: text('image_url').default('/logo.png').notNull(),
    status: varchar('status', { length: 30 }).default('In Stock').notNull(), // 'In Stock' | 'Low Stock' | 'Out of Stock'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('products_sku_idx').on(table.sku),
    index('products_category_idx').on(table.category),
    index('products_bike_model_idx').on(table.bikeModel),
    index('products_status_idx').on(table.status),
  ]
);

export const productBranchStock = pgTable(
  'product_branch_stock',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    productId: varchar('product_id', { length: 50 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    branchId: varchar('branch_id', { length: 50 })
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('pbs_product_branch_idx').on(table.productId, table.branchId),
  ]
);

export const productPriceHistory = pgTable('product_price_history', {
  id: varchar('id', { length: 100 }).primaryKey(),
  productId: varchar('product_id', { length: 50 })
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  oldCostPrice: numeric('old_cost_price', { precision: 10, scale: 2 }),
  newCostPrice: numeric('new_cost_price', { precision: 10, scale: 2 }),
  oldWholesalePrice: numeric('old_wholesale_price', { precision: 10, scale: 2 }).notNull(),
  newWholesalePrice: numeric('new_wholesale_price', { precision: 10, scale: 2 }).notNull(),
  oldRetailPrice: numeric('old_retail_price', { precision: 10, scale: 2 }).notNull(),
  newRetailPrice: numeric('new_retail_price', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  changedByUserId: text('changed_by_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --------------------------------------------------------------------------
// 4. TRADE PROMOTIONAL SCHEMES
// --------------------------------------------------------------------------
export const tradeSchemes = pgTable(
  'trade_schemes',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    productId: varchar('product_id', { length: 50 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    schemeType: varchar('scheme_type', { length: 50 }).notNull(), // 'buy_x_get_y' | 'net_rate'
    buyQuantity: integer('buy_quantity').default(1).notNull(),
    freeQuantity: integer('free_quantity').default(0).notNull(),
    netSchemeRate: numeric('net_scheme_rate', { precision: 10, scale: 2 }),
    applicableTier: varchar('applicable_tier', { length: 50 }).default('Wholesale Only').notNull(),
    validFrom: timestamp('valid_from').notNull(),
    validTo: timestamp('valid_to').notNull(),
    status: varchar('status', { length: 30 }).default('Active').notNull(), // 'Active' | 'Paused' | 'Expired'
    remarks: text('remarks'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('trade_schemes_product_idx').on(table.productId)]
);

// --------------------------------------------------------------------------
// 5. CUSTOMERS & WHOLESALE DEALERS
// --------------------------------------------------------------------------
export const customers = pgTable(
  'customers',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // 'CUST-002'
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull().unique(),
    city: varchar('city', { length: 100 }).default('Karachi').notNull(),
    route: varchar('route', { length: 150 }).default('Saddar Counter').notNull(),
    salesman: varchar('salesman', { length: 100 }).default('Counter Cashier').notNull(),
    customerType: varchar('customer_type', { length: 50 }).default('Wholesale Dealer').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).default('Credit / Khata').notNull(),
    openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
    currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).default('100000.00').notNull(),
    lastPaymentDate: timestamp('last_payment_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('customers_phone_idx').on(table.phone),
    index('customers_route_idx').on(table.route),
  ]
);

// --------------------------------------------------------------------------
// 6. SALES ORDERS & INVOICES
// --------------------------------------------------------------------------
export const orders = pgTable(
  'orders',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // 'ORD-9842'
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(), // 'SA-64276'
    customerId: varchar('customer_id', { length: 50 }).notNull().default('walkin'),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }),
    customerCity: varchar('customer_city', { length: 100 }).default('Karachi').notNull(),
    branchId: varchar('branch_id', { length: 50 })
      .notNull()
      .references(() => branches.id),
    orderType: varchar('order_type', { length: 30 }).default('Wholesale').notNull(), // 'Wholesale' | 'Retail'
    orderStatus: varchar('order_status', { length: 30 }).default('Completed').notNull(), // 'Completed' | 'Pending' | 'In-Progress' | 'Cancelled'
    paymentMethod: varchar('payment_method', { length: 50 }).default('Cash on Counter').notNull(),
    subtotalAmount: numeric('subtotal_amount', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    shippingCharges: numeric('shipping_charges', { precision: 10, scale: 2 }).default('0.00').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    cashReceived: numeric('cash_received', { precision: 12, scale: 2 }).default('0.00').notNull(),
    onlineReceived: numeric('online_received', { precision: 12, scale: 2 }).default('0.00').notNull(),
    paymentProofUrl: text('payment_proof_url'),
    changeReturned: numeric('change_returned', { precision: 10, scale: 2 }).default('0.00').notNull(),
    netBalanceAdded: numeric('net_balance_added', { precision: 12, scale: 2 }).default('0.00').notNull(),
    remarks: text('remarks'),
    createdByUserId: text('created_by_user_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('orders_invoice_idx').on(table.invoiceNumber),
    index('orders_customer_idx').on(table.customerId),
    index('orders_branch_idx').on(table.branchId),
    index('orders_status_idx').on(table.orderStatus),
  ]
);

export const orderItems = pgTable(
  'order_items',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    orderId: varchar('order_id', { length: 50 })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 50 }).notNull(),
    productName: varchar('product_name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    bikeModel: varchar('bike_model', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    unitRate: numeric('unit_rate', { precision: 10, scale: 2 }).notNull(),
    pricingTier: varchar('pricing_tier', { length: 30 }).default('Wholesale').notNull(),
    isSchemeApplied: boolean('is_scheme_applied').default(false).notNull(),
    schemeRate: numeric('scheme_rate', { precision: 10, scale: 2 }),
    quantity: integer('quantity').notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)]
);

// --------------------------------------------------------------------------
// 7. CUSTOMER LEDGER TRANSACTIONS (KHATA)
// --------------------------------------------------------------------------
export const customerLedgerTransactions = pgTable(
  'customer_ledger_transactions',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    customerId: varchar('customer_id', { length: 50 })
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    orderId: varchar('order_id', { length: 50 })
      .references(() => orders.id, { onDelete: 'set null' }),
    voucherNumber: varchar('voucher_number', { length: 100 }).notNull().unique(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'Sale Invoice' | 'Cash Recovery' | 'Bank Transfer' | 'Return Adjustment' | 'Opening Balance'
    description: text('description').notNull(),
    debitAmount: numeric('debit_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    creditAmount: numeric('credit_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    runningBalance: numeric('running_balance', { precision: 12, scale: 2 }).notNull(),
    collectorName: varchar('collector_name', { length: 100 }),
    proofUrl: text('proof_url'),
    transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  },
  (table) => [
    index('clt_customer_idx').on(table.customerId),
    index('clt_voucher_idx').on(table.voucherNumber),
  ]
);

// --------------------------------------------------------------------------
// 8. TEAM MEMBERS & EMPLOYEES
// --------------------------------------------------------------------------
export const teamMembers = pgTable(
  'team_members',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // 'mem-1'
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 150 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 50 }).notNull(),
    branchId: varchar('branch_id', { length: 50 })
      .notNull()
      .references(() => branches.id),
    avatarUrl: text('avatar_url'),
    status: varchar('status', { length: 30 }).default('active').notNull(), // 'active' | 'on-duty' | 'on-leave'
    joinedDate: timestamp('joined_date').defaultNow().notNull(),
  },
  (table) => [index('team_branch_idx').on(table.branchId)]
);

// --------------------------------------------------------------------------
// 9. ATTENDANCE LOGGING
// --------------------------------------------------------------------------
export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 50 })
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'cascade' }),
    branchId: varchar('branch_id', { length: 50 })
      .notNull()
      .references(() => branches.id),
    attendanceDate: date('attendance_date').notNull(),
    status: varchar('status', { length: 30 }).default('present').notNull(), // 'present' | 'late' | 'half-day' | 'absent' | 'on-leave'
    checkInTime: varchar('check_in_time', { length: 20 }).default('--').notNull(),
    checkOutTime: varchar('check_out_time', { length: 20 }).default('--').notNull(),
    shiftTiming: varchar('shift_timing', { length: 50 }).default('09:00 AM - 07:00 PM').notNull(),
    overtimeHours: numeric('overtime_hours', { precision: 4, scale: 2 }).default('0.00').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('att_employee_date_idx').on(table.employeeId, table.attendanceDate),
    index('att_branch_idx').on(table.branchId),
  ]
);

// --------------------------------------------------------------------------
// 10. DELIVERY RIDERS & GPS FLEET TRACKING
// --------------------------------------------------------------------------
export const deliveryRiders = pgTable(
  'delivery_riders',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull().unique(),
    vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
    currentStatus: varchar('current_status', { length: 30 }).default('offline').notNull(), // 'idle' | 'en_route_delivery' | 'offline'
    currentLatitude: numeric('current_latitude', { precision: 10, scale: 6 }).default('24.860700').notNull(),
    currentLongitude: numeric('current_longitude', { precision: 10, scale: 6 }).default('67.001100').notNull(),
    activeOrderId: varchar('active_order_id', { length: 50 })
      .references(() => orders.id, { onDelete: 'set null' }),
    lastPingAt: timestamp('last_ping_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('riders_status_idx').on(table.currentStatus)]
);

export const riderLocationLogs = pgTable(
  'rider_location_logs',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    riderId: varchar('rider_id', { length: 50 })
      .notNull()
      .references(() => deliveryRiders.id, { onDelete: 'cascade' }),
    latitude: numeric('latitude', { precision: 10, scale: 6 }).notNull(),
    longitude: numeric('longitude', { precision: 10, scale: 6 }).notNull(),
    speedKmh: numeric('speed_kmh', { precision: 5, scale: 2 }),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  },
  (table) => [index('rll_rider_time_idx').on(table.riderId, table.recordedAt)]
);

// --------------------------------------------------------------------------
// 11. NOTIFICATIONS & SYSTEM HEALTH
// --------------------------------------------------------------------------
export const notifications = pgTable(
  'notifications',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    notificationType: varchar('notification_type', { length: 50 }).notNull(), // 'orders' | 'stock' | 'attendance' | 'pricing' | 'system'
    branchId: varchar('branch_id', { length: 50 }).references(() => branches.id),
    isRead: boolean('is_read').default(false).notNull(),
    isUrgent: boolean('is_urgent').default(false).notNull(),
    actionUrl: text('action_url'),
    actionLabel: varchar('action_label', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notif_type_idx').on(table.notificationType),
    index('notif_read_idx').on(table.isRead),
  ]
);

export const branchNodes = pgTable('branch_nodes', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'main', 'branch-2', 'branch-3'
  branchId: varchar('branch_id', { length: 50 })
    .notNull()
    .references(() => branches.id),
  counterName: varchar('counter_name', { length: 150 }).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }).notNull(),
  pingLatencyMs: integer('ping_latency_ms').default(15).notNull(),
  status: varchar('status', { length: 30 }).default('online').notNull(), // 'online' | 'degraded' | 'offline'
  lastSyncTime: timestamp('last_sync_time').defaultNow().notNull(),
  syncHealth: varchar('sync_health', { length: 50 }).default('Fully Operational').notNull(),
});

// --------------------------------------------------------------------------
// 12. RELATIONS DEFINITIONS (DRIZZLE ORM)
// --------------------------------------------------------------------------
export const productsRelations = relations(products, ({ many }) => ({
  branchStock: many(productBranchStock),
  priceHistory: many(productPriceHistory),
  tradeSchemes: many(tradeSchemes),
  orderItems: many(orderItems),
}));

export const tradeSchemesRelations = relations(tradeSchemes, ({ one }) => ({
  product: one(products, {
    fields: [tradeSchemes.productId],
    references: [products.id],
  }),
}));

export const productBranchStockRelations = relations(productBranchStock, ({ one }) => ({
  product: one(products, {
    fields: [productBranchStock.productId],
    references: [products.id],
  }),
  branch: one(branches, {
    fields: [productBranchStock.branchId],
    references: [branches.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  items: many(orderItems),
  ledgerTransaction: one(customerLedgerTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  transactions: many(customerLedgerTransactions),
}));

export const customerLedgerTransactionsRelations = relations(customerLedgerTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [customerLedgerTransactions.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [customerLedgerTransactions.orderId],
    references: [orders.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  branch: one(branches, {
    fields: [teamMembers.branchId],
    references: [branches.id],
  }),
  attendance: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(teamMembers, {
    fields: [attendanceRecords.employeeId],
    references: [teamMembers.id],
  }),
  branch: one(branches, {
    fields: [attendanceRecords.branchId],
    references: [branches.id],
  }),
}));

export const deliveryRidersRelations = relations(deliveryRiders, ({ one, many }) => ({
  activeOrder: one(orders, {
    fields: [deliveryRiders.activeOrderId],
    references: [orders.id],
  }),
  logs: many(riderLocationLogs),
}));
