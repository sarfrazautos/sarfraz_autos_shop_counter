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
import { UserIcon, BellIcon, CommandIcon, LifeBuoyIcon, LogOutIcon } from "lucide-react";

const user = {
	name: "Sarfraz Admin",
	email: "admin@sarfrazautos.com",
	avatar: "/logo.png",
};

export function NavUser() {
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
						<UserIcon />
						Profile
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/dashboard/notifications" />} nativeButton={false}>
						<BellIcon />
						Notifications
					</DropdownMenuItem>
					<DropdownMenuItem>
						<CommandIcon />
						Keyboard shortcuts
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
					<DropdownMenuItem variant="destructive" render={<Link href="/auth" />} nativeButton={false}>
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
