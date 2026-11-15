/**
 * Standardized Query Key Factory for TanStack Query
 * Ensures consistent cache invalidation and instant zero-reload retrieval across all pages.
 */
export const queryKeys = {
  // Products & Inventory
  products: {
    all: ["products"] as const,
    list: (filters: Record<string, unknown> = {}) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },

  // Trade Schemes
  tradeSchemes: {
    all: ["trade-schemes"] as const,
    list: (filters: Record<string, unknown> = {}) => ["trade-schemes", "list", filters] as const,
    detail: (id: string) => ["trade-schemes", "detail", id] as const,
  },

  // Counter POS & Orders
  orders: {
    all: ["orders"] as const,
    list: (filters: Record<string, unknown> = {}) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },

  // Customers & Ledgers (Khata)
  customers: {
    all: ["customers"] as const,
    list: (filters: Record<string, unknown> = {}) => ["customers", "list", filters] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
    ledger: (customerId: string) => ["customers", "ledger", customerId] as const,
    aging: (filters: Record<string, unknown> = {}) => ["customers", "aging", filters] as const,
  },

  ledger: {
    all: ["ledger"] as const,
    accounts: (customerId?: string) => ["ledger", "accounts", customerId] as const,
  },

  reports: {
    all: ["reports"] as const,
    aging: (filters: Record<string, unknown> = {}) => ["reports", "aging", filters] as const,
  },

  // Team & Attendance
  team: {
    all: ["team"] as const,
    list: (branchId?: string) => ["team", "list", branchId] as const,
    members: (branchId?: string) => ["team", "members", branchId] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    list: (filters: Record<string, unknown> = {}) => ["attendance", "list", filters] as const,
    today: (branchId?: string) => ["attendance", "today", branchId] as const,
    history: (filters: Record<string, unknown> = {}) => ["attendance", "history", filters] as const,
  },

  // Riders & GPS Tracking
  riders: {
    all: ["riders"] as const,
    locations: () => ["riders", "locations"] as const,
  },

  // Notifications & System Health
  notifications: {
    all: ["notifications"] as const,
    list: (filters: Record<string, unknown> = {}) => ["notifications", "list", filters] as const,
    unread: () => ["notifications", "unread"] as const,
  },
  systemHealth: {
    all: ["system-health"] as const,
    nodes: () => ["system-health", "nodes"] as const,
  },
  dashboard: {
    analytics: (days?: number) => ["dashboard", "analytics", days] as const,
  },
};
