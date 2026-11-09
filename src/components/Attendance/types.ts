export type BranchId = "all" | "main" | "branch-2" | "branch-3";

export type AttendanceStatus = "present" | "late" | "half-day" | "absent" | "on-leave";

export interface AttendanceRecord {
	id: string;
	employeeId: string;
	employeeName: string;
	employeeRole: string;
	avatarUrl?: string;
	branchId: "main" | "branch-2" | "branch-3";
	branchName: string;
	status: AttendanceStatus;
	checkInTime: string; // e.g. "09:05 AM" or "--"
	checkOutTime: string; // e.g. "06:15 PM" or "--"
	shiftTiming: string; // e.g. "09:00 AM - 07:00 PM"
	notes: string;
	overtimeHours?: number;
}

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
	{
		id: "att-001",
		employeeId: "mem-1",
		employeeName: "Sarfraz Ahmed",
		employeeRole: "General Manager & Master Tech",
		avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		branchId: "main",
		branchName: "1st Branch (Saddar)",
		status: "present",
		checkInTime: "08:48 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Opening keys & main counter inspection complete",
		overtimeHours: 0,
	},
	{
		id: "att-002",
		employeeId: "mem-2",
		employeeName: "Tariq Mahmood",
		employeeRole: "Chief Counter Sales Specialist",
		avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
		branchId: "main",
		branchName: "1st Branch (Saddar)",
		status: "present",
		checkInTime: "08:55 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "High footfall counter duty - morning register verified",
		overtimeHours: 0,
	},
	{
		id: "att-003",
		employeeId: "mem-3",
		employeeName: "Bilal Farooq",
		employeeRole: "Spare Parts Inventory Controller",
		avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
		branchId: "main",
		branchName: "1st Branch (Saddar)",
		status: "late",
		checkInTime: "09:35 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Delayed due to supplier dispatch at M.A Jinnah road warehouse",
		overtimeHours: 0,
	},
	{
		id: "att-004",
		employeeId: "mem-4",
		employeeName: "Hamza Malik",
		employeeRole: "Senior Diagnostic Mechanic",
		avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
		branchId: "branch-2",
		branchName: "2nd Branch (Gulshan)",
		status: "present",
		checkInTime: "08:50 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Engine tuning bay #1 setup done",
		overtimeHours: 1.5,
	},
	{
		id: "att-005",
		employeeId: "mem-5",
		employeeName: "Zubair Khan",
		employeeRole: "Customer Relationship Officer",
		avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
		branchId: "branch-2",
		branchName: "2nd Branch (Gulshan)",
		status: "present",
		checkInTime: "09:02 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Booking 8 scheduled bike servicing jobs",
		overtimeHours: 0,
	},
	{
		id: "att-006",
		employeeId: "mem-6",
		employeeName: "Rashid Ali",
		employeeRole: "Branch In-Charge",
		avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
		branchId: "branch-3",
		branchName: "3rd Branch (DHA)",
		status: "present",
		checkInTime: "08:45 AM",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Handling VIP express lubricant change orders",
		overtimeHours: 0,
	},
	{
		id: "att-007",
		employeeId: "mem-7",
		employeeName: "Kamran Shah",
		employeeRole: "Quick Service Technician",
		avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
		branchId: "branch-3",
		branchName: "3rd Branch (DHA)",
		status: "absent",
		checkInTime: "--",
		checkOutTime: "--",
		shiftTiming: "09:00 AM - 07:00 PM",
		notes: "Medical leave - inform notice sent to manager",
		overtimeHours: 0,
	},
	{
		id: "att-008",
		employeeId: "mem-8",
		employeeName: "Adnan Sheikh",
		employeeRole: "Accounts & Billing Cashier",
		avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
		branchId: "branch-2",
		branchName: "2nd Branch (Gulshan)",
		status: "half-day",
		checkInTime: "09:00 AM",
		checkOutTime: "01:30 PM",
		shiftTiming: "09:00 AM - 02:00 PM",
		notes: "Half day approved for university examination",
		overtimeHours: 0,
	},
];

