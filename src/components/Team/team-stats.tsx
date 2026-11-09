"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, Building2, MapPin } from "lucide-react";
import type { BranchId, TeamMember } from "./types";

interface TeamStatsProps {
	members: TeamMember[];
	selectedBranch: BranchId;
	onSelectBranch: (branch: BranchId) => void;
}

export function TeamStats({
	members,
	selectedBranch,
	onSelectBranch,
}: TeamStatsProps) {
	const total = members.length;
	const mainCount = members.filter((m) => m.branchId === "main").length;
	const branch2Count = members.filter((m) => m.branchId === "branch-2").length;
	const branch3Count = members.filter((m) => m.branchId === "branch-3").length;

	const statCards = [
		{
			id: "all" as BranchId,
			title: "Total Team Force",
			subtitle: "Across all branches",
			count: total,
			icon: <Users className="size-5 text-primary" />,
			badgeText: "All Locations",
			accent: "hover:border-primary/50",
		},
		{
			id: "main" as BranchId,
			title: "1st Branch (Main)",
			subtitle: "Saddar Central Workshop",
			count: mainCount,
			icon: <Store className="size-5 text-emerald-600 dark:text-emerald-400" />,
			badgeText: "HQ Workshop",
			accent: "hover:border-emerald-500/50",
		},
		{
			id: "branch-2" as BranchId,
			title: "2nd Branch",
			subtitle: "Gulshan Auto Hub",
			count: branch2Count,
			icon: <Building2 className="size-5 text-sky-600 dark:text-sky-400" />,
			badgeText: "North Hub",
			accent: "hover:border-sky-500/50",
		},
		{
			id: "branch-3" as BranchId,
			title: "3rd Branch",
			subtitle: "DHA Express Counter",
			count: branch3Count,
			icon: <MapPin className="size-5 text-amber-600 dark:text-amber-400" />,
			badgeText: "Express Desk",
			accent: "hover:border-amber-500/50",
		},
	];

	return (
		<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
			{statCards.map((card) => {
				const isSelected = selectedBranch === card.id;
				return (
					<Card
						key={card.id}
						onClick={() => onSelectBranch(card.id)}
						className={`relative cursor-pointer transition-all duration-150 border ${
							card.accent
						} ${
							isSelected
								? "ring-2 ring-primary border-primary bg-primary/[0.03] shadow-sm"
								: "hover:bg-muted/40"
						}`}
					>
						<CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-3">
							<div className="flex items-center justify-between gap-2">
								<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
									{card.icon}
								</div>
								<Badge
									variant={isSelected ? "default" : "secondary"}
									className="text-[11px] font-normal"
								>
									{card.badgeText}
								</Badge>
							</div>

							<div>
								<div className="font-heading text-3xl font-semibold tracking-tight text-foreground">
									{card.count}
									<span className="text-xs font-normal text-muted-foreground ml-1.5">
										members
									</span>
								</div>
								<h3 className="text-sm font-medium text-foreground mt-0.5">
									{card.title}
								</h3>
								<p className="text-xs text-muted-foreground truncate">
									{card.subtitle}
								</p>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

