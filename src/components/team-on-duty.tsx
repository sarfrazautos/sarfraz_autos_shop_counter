"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import Link from "next/link";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import { INITIAL_MEMBERS } from "@/components/Team/types";

export function TeamOnDuty({
	className,
	...props
}: ComponentProps<typeof Card>) {
	// Show active team members
	const activeMembers = INITIAL_MEMBERS.slice(0, 4);

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<Users className="size-4 text-primary" />
						Branch Employees on Duty
					</CardTitle>
					<CardDescription className="text-xs">
						Active counter operators, advisors, and mechanics across branches.
					</CardDescription>
				</div>
				<Button
					variant="ghost"
					size="xs"
					render={<Link href="/dashboard/team" />}
					nativeButton={false}
					className="text-xs text-primary hover:text-primary/80 gap-1 cursor-pointer"
				>
					<span>View All</span>
					<ArrowRight className="size-3" />
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="divide-y divide-border/60">
					{activeMembers.map((member) => (
						<div
							key={member.id}
							className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
						>
							<div className="flex items-center gap-3 min-w-0">
								<Avatar className="size-8 shrink-0">
									<AvatarImage src={member.avatarUrl} alt={member.name} />
									<AvatarFallback className="text-xs font-bold">
										{member.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="font-semibold text-xs text-foreground truncate">
										{member.name}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										{member.role} • {member.branch.split("(")[0]}
									</p>
								</div>
							</div>

							<Badge
								variant="outline"
								className="text-[10px] shrink-0 font-medium bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
							>
								{member.status === "on-duty" ? "On Duty" : "Active"}
							</Badge>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
