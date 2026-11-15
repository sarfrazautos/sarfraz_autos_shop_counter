"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Calendar, MapPin, Trash2, AlertTriangle } from "lucide-react";
import type { TeamMember } from "./types";

interface TeamCardProps {
	member: TeamMember;
	onDelete?: (id: string) => void;
}

export function TeamCard({ member, onDelete }: TeamCardProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const initials = member.name
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	const branchBadgeLabel =
		member.branchId === "main"
			? "1st Branch"
			: member.branchId === "branch-2"
			? "2nd Branch"
			: "3rd Branch";

	const handleDelete = () => {
		onDelete?.(member.id);
		setDeleteDialogOpen(false);
	};

	return (
		<Card className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-150 hover:border-primary/40 hover:shadow-md">
			<CardContent className="p-5 flex flex-col justify-between h-full gap-4">
				{/* Top Header: Avatar + Name + Branch & Delete Button */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Avatar size="lg" className="size-12 border-2 border-background shadow-xs shrink-0">
							<AvatarImage src={member.avatarUrl} alt={member.name} />
							<AvatarFallback className="font-semibold text-xs">
								{initials}
							</AvatarFallback>
						</Avatar>

						<div className="min-w-0 flex-1">
							<h3 className="font-heading text-base font-semibold text-foreground truncate">
								{member.name}
							</h3>
							<p className="text-xs text-muted-foreground truncate font-medium">
								{member.role}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5 shrink-0">
						{/* Gray normal branch badge */}
						<Badge
							variant="secondary"
							className="text-[11px] font-normal bg-muted text-muted-foreground border border-border/60 hover:bg-muted"
						>
							{branchBadgeLabel}
						</Badge>

						{/* Delete button with Confirmation Alert Dialog */}
						<Button
							size="icon-xs"
							variant="ghost"
							onClick={() => setDeleteDialogOpen(true)}
							aria-label={`Delete ${member.name}`}
							title="Delete Staff Member"
							className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				</div>

				{/* Location / Branch Tagline */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5">
					<MapPin className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="truncate">{member.branch}</span>
				</div>

				{/* Contact & Meta details */}
				<div className="space-y-2 pt-1 border-t text-xs">
					<a
						href={`mailto:${member.email}`}
						className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group/link"
					>
						<Mail className="size-3.5 shrink-0 text-muted-foreground group-hover/link:text-primary transition-colors" />
						<span className="truncate">{member.email}</span>
					</a>

					<a
						href={`tel:${member.phone.replace(/\s+/g, "")}`}
						className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group/link"
					>
						<Phone className="size-3.5 shrink-0 text-muted-foreground group-hover/link:text-primary transition-colors" />
						<span className="font-mono">{member.phone}</span>
					</a>

					<div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<Calendar className="size-3 text-muted-foreground" />
							Joined: <span className="font-medium text-foreground">{member.joinedDate}</span>
						</span>
					</div>
				</div>
			</CardContent>

			{/* Delete Staff Member Confirmation Alert Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 mb-2">
							<AlertTriangle className="size-5" />
						</div>
						<AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <span className="font-semibold text-foreground">{member.name}</span> ({member.role})? This will remove them from the staff team directory and attendance records.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
						>
							Yes, Delete Staff Member
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
