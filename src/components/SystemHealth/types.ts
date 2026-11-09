export interface StorageQuota {
	service: string;
	purpose: string;
	usedFormatted: string;
	limitFormatted: string;
	percentUsed: number;
	tier: string;
	status: "healthy" | "warning" | "critical";
	details: string;
}

export interface BranchNodeStatus {
	id: "main" | "branch-2" | "branch-3";
	branchName: string;
	tagline: string;
	counterName: string;
	ipAddress: string;
	pingLatency: string;
	status: "online" | "degraded" | "offline";
	lastSyncTime: string;
	todayTransactions: number;
	activeStaffCount: number;
	syncHealth: string;
}

export const STORAGE_QUOTAS: StorageQuota[] = [
	{
		service: "Database Storage (PostgreSQL)",
		purpose: "Tables, inventory records, sales invoices & team members",
		usedFormatted: "134.8 MB",
		limitFormatted: "500 MB",
		percentUsed: 27,
		tier: "Free Tier (Hobby)",
		status: "healthy",
		details: "365.2 MB remaining before upgrade threshold",
	},
	{
		service: "Vercel Blob Storage",
		purpose: "Spare parts product images, team avatars & catalog attachments",
		usedFormatted: "342.1 MB",
		limitFormatted: "1.0 GB",
		percentUsed: 34,
		tier: "Free Tier (Hobby)",
		status: "healthy",
		details: "657.9 MB remaining of 1 GB monthly active assets",
	},
	{
		service: "Vercel Edge Bandwidth (Fast Data Transfer)",
		purpose: "Static assets, image caching & API response delivery",
		usedFormatted: "18.4 GB",
		limitFormatted: "100 GB",
		percentUsed: 18,
		tier: "Monthly Free Allowance",
		status: "healthy",
		details: "Resets on 1st of every month",
	},
];

export const BRANCH_NODES: BranchNodeStatus[] = [
	{
		id: "main",
		branchName: "1st Branch (Main Workshop)",
		tagline: "Saddar Auto Market, Karachi",
		counterName: "POS Counter 01 (Master Terminal)",
		ipAddress: "192.168.1.10 / static",
		pingLatency: "18ms",
		status: "online",
		lastSyncTime: "12 seconds ago",
		todayTransactions: 84,
		activeStaffCount: 8,
		syncHealth: "100% synchronized with Cloud Postgres",
	},
	{
		id: "branch-2",
		branchName: "2nd Branch (Gulshan Hub)",
		tagline: "University Road, Gulshan-e-Iqbal",
		counterName: "POS Counter 02 (Retail Desk)",
		ipAddress: "192.168.2.14 / dynamic",
		pingLatency: "24ms",
		status: "online",
		lastSyncTime: "45 seconds ago",
		todayTransactions: 56,
		activeStaffCount: 5,
		syncHealth: "100% synchronized with Cloud Postgres",
	},
	{
		id: "branch-3",
		branchName: "3rd Branch (DHA Express)",
		tagline: "Phase 6 Commercial, DHA",
		counterName: "POS Counter 03 (Express Lane)",
		ipAddress: "192.168.3.22 / dynamic",
		pingLatency: "16ms",
		status: "online",
		lastSyncTime: "28 seconds ago",
		todayTransactions: 39,
		activeStaffCount: 4,
		syncHealth: "100% synchronized with Cloud Postgres",
	},
];
