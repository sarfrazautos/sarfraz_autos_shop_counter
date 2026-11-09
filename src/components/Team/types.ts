export type BranchId = "all" | "main" | "branch-2" | "branch-3";

export interface TeamMember {
	id: string;
	name: string;
	role: string;
	email: string;
	phone: string;
	branch: string;
	branchId: "main" | "branch-2" | "branch-3";
	joinedDate: string;
	avatarUrl?: string;
	status: "active" | "on-duty" | "on-leave";
}

export interface BranchStat {
	id: "main" | "branch-2" | "branch-3";
	name: string;
	code: string;
	tagline: string;
	count: number;
	activeToday: number;
}

export const INITIAL_MEMBERS: TeamMember[] = [
	{
		id: "mem-1",
		name: "Sarfraz Ahmed",
		role: "General Manager & Master Tech",
		email: "sarfraz@sarfrazautos.com",
		phone: "+92 300 2345671",
		branch: "Main Branch (Saddar Workshop)",
		branchId: "main",
		joinedDate: "12 Jan, 2021",
		avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		status: "on-duty",
	},
	{
		id: "mem-2",
		name: "Tariq Mahmood",
		role: "Chief Counter Sales Specialist",
		email: "tariq.m@sarfrazautos.com",
		phone: "+92 321 8765432",
		branch: "Main Branch (Saddar Workshop)",
		branchId: "main",
		joinedDate: "04 Mar, 2022",
		avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
		status: "on-duty",
	},
	{
		id: "mem-3",
		name: "Hamza Bilal",
		role: "Branch Lead & Parts Advisor",
		email: "hamza.b@sarfrazautos.com",
		phone: "+92 333 4567890",
		branch: "2nd Branch (Gulshan Auto Hub)",
		branchId: "branch-2",
		joinedDate: "19 Aug, 2022",
		avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
		status: "active",
	},
	{
		id: "mem-4",
		name: "Daniyal Khan",
		role: "Express Diagnostics & Counter Cashier",
		email: "daniyal.k@sarfrazautos.com",
		phone: "+92 345 9876543",
		branch: "3rd Branch (DHA Express Outpost)",
		branchId: "branch-3",
		joinedDate: "02 Feb, 2023",
		avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
		status: "on-duty",
	},
	{
		id: "mem-5",
		name: "Usama Rafiq",
		role: "Inventory & Spare Parts Officer",
		email: "usama.r@sarfrazautos.com",
		phone: "+92 312 3456789",
		branch: "Main Branch (Saddar Workshop)",
		branchId: "main",
		joinedDate: "15 Jun, 2023",
		avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
		status: "active",
	},
	{
		id: "mem-6",
		name: "Farhan Siddiqui",
		role: "Senior Engine Technician",
		email: "farhan.s@sarfrazautos.com",
		phone: "+92 331 6543210",
		branch: "2nd Branch (Gulshan Auto Hub)",
		branchId: "branch-2",
		joinedDate: "10 Nov, 2023",
		avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
		status: "on-duty",
	},
	{
		id: "mem-7",
		name: "Zeeshan Ali",
		role: "Billing & Retail Counter Executive",
		email: "zeeshan.a@sarfrazautos.com",
		phone: "+92 315 7890123",
		branch: "Main Branch (Saddar Workshop)",
		branchId: "main",
		joinedDate: "23 Jan, 2024",
		avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
		status: "active",
	},
	{
		id: "mem-8",
		name: "Rehan Qureshi",
		role: "Quick Service & Counter Clerk",
		email: "rehan.q@sarfrazautos.com",
		phone: "+92 340 1234567",
		branch: "3rd Branch (DHA Express Outpost)",
		branchId: "branch-3",
		joinedDate: "18 May, 2024",
		avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
		status: "on-leave",
	},
	{
		id: "mem-9",
		name: "Bilal Shah",
		role: "Brake & Suspension Specialist",
		email: "bilal.s@sarfrazautos.com",
		phone: "+92 301 9871234",
		branch: "2nd Branch (Gulshan Auto Hub)",
		branchId: "branch-2",
		joinedDate: "05 Oct, 2024",
		avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
		status: "active",
	},
];

