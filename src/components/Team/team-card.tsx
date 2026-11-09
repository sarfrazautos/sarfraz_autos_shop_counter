"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Mail, Phone, Calendar, MapPin, Trash2, AlertTriangle } from "lucide-react";
import type { TeamMember } from "./types";

interface TeamCardProps {
	member: TeamMember;
	onDelete?: (id: string) => void;
}

export function TeamCard({ member, onDelete }: TeamCardProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

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
		setDialogOpen(false);
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

						{/* Delete button with Confirmation Pop up Dialog */}
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger
								render={
									<Button
										size="icon-xs"
										variant="ghost"
										aria-label={`Delete ${member.name}`}
										className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</Button>
								}
							/>
							<DialogContent className="sm:max-w-md">
								<DialogHeader className="gap-2">
									<div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
										<AlertTriangle className="size-5" />
									</div>
									<DialogTitle className="text-base font-semibold">
										Delete Team Member
									</DialogTitle>
									<DialogDescription className="text-sm text-muted-foreground">
										Are you sure you want to delete <span className="font-semibold text-foreground">{member.name}</span>? This will remove their record from the shop directory.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter className="gap-2 sm:gap-0 pt-2">
									<DialogClose
										render={
											<Button variant="outline" size="sm" className="cursor-pointer">
												Cancel
											</Button>
										}
									/>
									<Button
										variant="destructive"
										size="sm"
										onClick={handleDelete}
										className="cursor-pointer"
									>
										Delete Member
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
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
		</Card>
	);
}
