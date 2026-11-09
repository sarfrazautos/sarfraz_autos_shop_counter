"use client";

import { useState } from "react";
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Store, Building2, MapPin, CheckCircle2 } from "lucide-react";
import type { TeamMember } from "./types";

interface AddMemberSheetProps {
	onAddMember: (member: TeamMember) => void;
}

export function AddMemberSheet({ onAddMember }: AddMemberSheetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Form fields
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [branchId, setBranchId] = useState<"main" | "branch-2" | "branch-3">("main");
	const [errors, setErrors] = useState<Record<string, string>>({});

	const resetForm = () => {
		setName("");
		setRole("");
		setEmail("");
		setPhone("");
		setBranchId("main");
		setErrors({});
		setIsSuccess(false);
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = "Full name is required";
		if (!role.trim()) newErrors.role = "Role / Designation is required";
		if (!email.trim() || !email.includes("@"))
			newErrors.email = "Valid email address is required";
		if (!phone.trim()) newErrors.phone = "Phone number is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsSaving(true);

		// Format today's date (e.g. "09 Nov, 2026")
		const today = new Date();
		const formattedDate = today.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});

		const branchNameMap: Record<"main" | "branch-2" | "branch-3", string> = {
			main: "Main Branch (Saddar Workshop)",
			"branch-2": "2nd Branch (Gulshan Auto Hub)",
			"branch-3": "3rd Branch (DHA Express Outpost)",
		};

		// Simulate server delay as requested by user
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const newMember: TeamMember = {
			id: `mem-${Date.now()}`,
			name: name.trim(),
			role: role.trim(),
			email: email.trim().toLowerCase(),
			phone: phone.trim(),
			branch: branchNameMap[branchId],
			branchId,
			joinedDate: formattedDate,
			status: "active",
		};

		onAddMember(newMember);
		setIsSaving(false);
		setIsSuccess(true);

		// Reset fields and close sheet
		setTimeout(() => {
			resetForm();
			setIsOpen(false);
		}, 300);
	};

	return (
		<Sheet open={isOpen} onOpenChange={(open) => {
			if (!isSaving) {
				setIsOpen(open);
				if (!open) resetForm();
			}
		}}>
			<SheetTrigger render={
				<Button size="sm" className="gap-2 cursor-pointer">
					<UserPlus className="size-4" />
					Add Team Member
				</Button>
			} />

			<SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
				<SheetHeader className="p-5 pb-2">
					<SheetTitle className="text-xl font-bold font-heading">
						Add Team Member
					</SheetTitle>
					<SheetDescription className="text-xs text-muted-foreground">
						Register a new shop counter employee, mechanic, or branch representative.
					</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSave} className="flex flex-col flex-1 px-5 py-3 gap-4">
					{/* Name */}
					<div className="space-y-1.5">
						<Label htmlFor="member-name" className="text-xs font-medium">
							Full Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="member-name"
							placeholder="e.g. Tariq Mahmood"
							value={name}
							disabled={isSaving}
							onChange={(e) => {
								setName(e.target.value);
								if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
							}}
							className={errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}
						/>
						{errors.name && (
							<p className="text-[11px] text-destructive">{errors.name}</p>
						)}
					</div>

					{/* Role */}
					<div className="space-y-1.5">
						<Label htmlFor="member-role" className="text-xs font-medium">
							Designation / Role <span className="text-destructive">*</span>
						</Label>
						<Input
							id="member-role"
							placeholder="e.g. Senior Counter Sales Specialist"
							value={role}
							disabled={isSaving}
							onChange={(e) => {
								setRole(e.target.value);
								if (errors.role) setErrors((prev) => ({ ...prev, role: "" }));
							}}
							className={errors.role ? "border-destructive focus-visible:ring-destructive/30" : ""}
						/>
						{errors.role && (
							<p className="text-[11px] text-destructive">{errors.role}</p>
						)}
					</div>

					{/* Email */}
					<div className="space-y-1.5">
						<Label htmlFor="member-email" className="text-xs font-medium">
							Email Address <span className="text-destructive">*</span>
						</Label>
						<Input
							id="member-email"
							type="email"
							placeholder="member@sarfrazautos.com"
							value={email}
							disabled={isSaving}
							onChange={(e) => {
								setEmail(e.target.value);
								if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
							}}
							className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
						/>
						{errors.email && (
							<p className="text-[11px] text-destructive">{errors.email}</p>
						)}
					</div>

					{/* Phone */}
					<div className="space-y-1.5">
						<Label htmlFor="member-phone" className="text-xs font-medium">
							Phone Number <span className="text-destructive">*</span>
						</Label>
						<Input
							id="member-phone"
							type="tel"
							placeholder="+92 300 1234567"
							value={phone}
							disabled={isSaving}
							onChange={(e) => {
								setPhone(e.target.value);
								if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
							}}
							className={errors.phone ? "border-destructive focus-visible:ring-destructive/30" : ""}
						/>
						{errors.phone && (
							<p className="text-[11px] text-destructive">{errors.phone}</p>
						)}
					</div>

					{/* Branch Selection */}
					<div className="space-y-1.5 pt-1">
						<Label className="text-xs font-medium">
							Assign to Branch <span className="text-destructive">*</span>
						</Label>
						<div className="grid grid-cols-1 gap-2">
							<button
								type="button"
								disabled={isSaving}
								onClick={() => setBranchId("main")}
								className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
									branchId === "main"
										? "border-primary bg-primary/[0.04] ring-1 ring-primary"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<Store className="size-4 text-emerald-600 shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-foreground">1st Branch (Main)</p>
									<p className="text-[11px] text-muted-foreground truncate">Saddar Central Workshop</p>
								</div>
							</button>

							<button
								type="button"
								disabled={isSaving}
								onClick={() => setBranchId("branch-2")}
								className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
									branchId === "branch-2"
										? "border-primary bg-primary/[0.04] ring-1 ring-primary"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<Building2 className="size-4 text-sky-600 shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-foreground">2nd Branch</p>
									<p className="text-[11px] text-muted-foreground truncate">Gulshan Auto Hub</p>
								</div>
							</button>

							<button
								type="button"
								disabled={isSaving}
								onClick={() => setBranchId("branch-3")}
								className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
									branchId === "branch-3"
										? "border-primary bg-primary/[0.04] ring-1 ring-primary"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<MapPin className="size-4 text-amber-600 shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-foreground">3rd Branch</p>
									<p className="text-[11px] text-muted-foreground truncate">DHA Express Counter</p>
								</div>
							</button>
						</div>
					</div>

					<SheetFooter className="p-0 pt-4 mt-auto border-t flex flex-row items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isSaving}
							onClick={() => {
								resetForm();
								setIsOpen(false);
							}}
							className="cursor-pointer"
						>
							Cancel
						</Button>

						<Button
							type="submit"
							size="sm"
							disabled={isSaving || isSuccess}
							className="cursor-pointer min-w-28"
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : isSuccess ? (
								<>
									<CheckCircle2 className="mr-2 size-4 text-emerald-300" />
									Saved!
								</>
							) : (
								"Save Member"
							)}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}

