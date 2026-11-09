import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({
	children,
	pathname = "#/overview",
}: {
	children: React.ReactNode;
	pathname?: string;
}) {
	return (
		<div className="overflow-hidden">
			<SidebarProvider className="relative h-svh">
				<AppSidebar pathname={pathname} />
				<SidebarInset className="min-w-0 md:peer-data-[variant=inset]:ml-0">
					<AppHeader pathname={pathname} />
					<div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 md:p-6">
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
