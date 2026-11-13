"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { BellIcon, Share2, Check } from "lucide-react";

export function AppHeader({ pathname }: { pathname?: string }) {
	const activeItem = navLinks.find((item) => item.path === pathname);
	const [copied, setCopied] = useState(false);

	const handleCopyUrl = () => {
		try {
			if (typeof window !== "undefined") {
				navigator.clipboard.writeText(window.location.href);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		} catch {
			// fallback
		}
	};

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6 bg-background/95 backdrop-blur-xs"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-3">
				{/* Share Button: Copies website / page URL to clipboard with feedback */}
				<Button
					size="icon-sm"
					variant="outline"
					onClick={handleCopyUrl}
					title={copied ? "Link copied to clipboard!" : "Share / Copy page link"}
					className="cursor-pointer transition-colors"
				>
					{copied ? (
						<Check className="size-4 text-emerald-600 stroke-[3]" />
					) : (
						<Share2 className="size-4 text-muted-foreground hover:text-foreground" />
					)}
					<span className="sr-only">Share link</span>
				</Button>

				{/* Notifications with badge */}
				<Button
					aria-label="Notifications"
					size="icon-sm"
					variant="outline"
					className="relative cursor-pointer"
					render={<Link href="/dashboard/notifications" />}
					nativeButton={false}
				>
					<BellIcon className="size-4" />
					<span className="absolute -top-1 -right-1 flex size-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-rose-500" />
					</span>
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
