"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, SlidersHorizontal, Users } from "lucide-react";
import { INITIAL_MEMBERS, type BranchId, type TeamMember } from "./types";
import { TeamStats } from "./team-stats";
import { TeamCard } from "./team-card";
import { AddMemberSheet } from "./add-member-sheet";

export function TeamView() {
	const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
	const [selectedBranch, setSelectedBranch] = useState<BranchId>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const handleAddMember = (newMember: TeamMember) => {
		setMembers((prev) => [newMember, ...prev]);
	};

	const handleDeleteMember = (id: string) => {
		setMembers((prev) => prev.filter((m) => m.id !== id));
	};

	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			const matchesBranch =
				selectedBranch === "all" || member.branchId === selectedBranch;

			const query = searchQuery.trim().toLowerCase();
			if (!query) return matchesBranch;

			const matchesQuery =
				member.name.toLowerCase().includes(query) ||
				member.role.toLowerCase().includes(query) ||
				member.email.toLowerCase().includes(query) ||
				member.phone.toLowerCase().includes(query) ||
				member.branch.toLowerCase().includes(query);

			return matchesBranch && matchesQuery;
		});
	}, [members, selectedBranch, searchQuery]);

	const branchTabs: { id: BranchId; label: string }[] = [
		{ id: "all", label: "All Staff" },
		{ id: "main", label: "1st Branch (Main)" },
		{ id: "branch-2", label: "2nd Branch" },
		{ id: "branch-3", label: "3rd Branch" },
	];

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							Shop Team Directory
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							{members.length} Total Staff
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage shop counter representatives, technicians, and branch staff across all 3 locations.
					</p>
				</div>

				<AddMemberSheet onAddMember={handleAddMember} />
			</div>

			{/* Top Metric Cards */}
			<TeamStats
				members={members}
				selectedBranch={selectedBranch}
				onSelectBranch={setSelectedBranch}
			/>

			{/* Filter & Search Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
				{/* Search Input */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search by name, role, email, or phone..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-sm"
					/>
				</div>

				{/* Branch Filter Pills */}
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-xs text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
						<SlidersHorizontal className="size-3" /> Branch:
					</span>
					{branchTabs.map((tab) => {
						const active = selectedBranch === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setSelectedBranch(tab.id)}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
									active
										? "bg-primary text-primary-foreground shadow-xs"
										: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Team Cards Grid */}
			{filteredMembers.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredMembers.map((member) => (
						<TeamCard
							key={member.id}
							member={member}
							onDelete={handleDeleteMember}
						/>
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed p-12 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
						<Users className="size-6 text-muted-foreground" />
					</div>
					<h3 className="mt-3 text-base font-semibold text-foreground">
						No team members found
					</h3>
					<p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
						No staff members matched your current branch or search criteria.
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedBranch("all");
							setSearchQuery("");
						}}
						className="mt-4"
					>
						Clear Filters
					</Button>
				</div>
			)}
		</div>
	);
}

