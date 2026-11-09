import { AppShell } from "@/components/app-shell";
import { SystemHealthView } from "@/components/SystemHealth/system-health-view";

export default function SystemHealthPage() {
	return (
		<AppShell pathname="/dashboard/system-health">
			<SystemHealthView />
		</AppShell>
	);
}

