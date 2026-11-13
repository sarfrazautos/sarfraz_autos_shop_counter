"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XIcon, Bell } from "lucide-react";

export function LatestChange() {
	const [isOpen, setIsOpen] = useState(true);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className={cn(
				"rounded-lg group/latest-change size-full min-h-24 justify-center border bg-card/60 hover:bg-card/90 transition-all",
				"relative flex size-full flex-col gap-1 overflow-hidden px-3.5 pt-2.5 pb-2 *:text-nowrap",
				"transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"
			)}
		>
			<div className="flex items-center justify-between">
				<span className="font-mono text-[9px] font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
					<span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
					Alert
				</span>
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						setIsOpen(false);
					}}
					aria-label="Close notification"
				>
					<XIcon className="size-3" />
				</button>
			</div>

			<Link
				href="/dashboard/notifications"
				onClick={() => setIsOpen(false)}
				className="flex flex-col gap-0.5 group/link cursor-pointer"
			>
				<p className="font-heading font-semibold text-xs text-foreground group-hover/link:text-primary transition-colors">
					Low stock & order alerts
				</p>
				<span className="text-[10px] text-muted-foreground">
					3 new alerts requiring action.
				</span>
				<span className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1 pt-1">
					<Bell className="size-2.5" />
					View notifications &rarr;
				</span>
			</Link>
		</div>
	);
}
