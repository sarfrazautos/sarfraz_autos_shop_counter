import { AppShell } from "@/components/app-shell";
import { NotificationsView } from "@/components/Notifications/notifications-view";

export default function NotificationsPage() {
	return (
		<AppShell pathname="/dashboard/notifications">
			<NotificationsView />
		</AppShell>
	);
}

