"use client";

import Link from "next/link";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { UsersIcon, BellIcon, LifeBuoyIcon, LogOutIcon, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { logoutAdminAction } from "@/app/actions/auth-actions";

const user = {
	name: "Shahmeer (Owner)",
	email: "admin@sarfrazautos-counter.com",
	avatar: "/logo.png",
};

export function NavUser() {
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		toast.add({
			title: "Signing Out",
			description: "Closing administrative session safely...",
			type: "info",
		});
		try {
			await logoutAdminAction();
			window.location.href = "/auth";
		} catch {
			window.location.href = "/auth";
		}
	};
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className="flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
					>
						<Avatar className="size-8">
							<AvatarImage src={user.avatar} />
							<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
						</Avatar>
					</button>
				}
			/>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="pointer-events-none flex items-center gap-2">
						<Avatar className="isolate size-8">
							<AvatarImage src={user.avatar} />
							<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">{user.name}</span>{" "}
							<br />
							<div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{user.email}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/dashboard/team" />} nativeButton={false}>
						<UsersIcon />
						Team
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/dashboard/notifications" />} nativeButton={false}>
						<BellIcon />
						Notifications
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/dashboard/help" />} nativeButton={false}>
						<LifeBuoyIcon />
						Help center
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						disabled={isLoggingOut}
						onClick={handleLogout}
						className="cursor-pointer"
					>
						{isLoggingOut ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<LogOutIcon className="size-4" />
						)}
						<span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
