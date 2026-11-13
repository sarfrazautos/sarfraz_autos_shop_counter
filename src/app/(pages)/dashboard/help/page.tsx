import { AppShell } from "@/components/app-shell";
import { HelpCenterView } from "@/components/Help/help-center-view";

export default function HelpCenterPage() {
	return (
		<AppShell pathname="/dashboard/help">
			<HelpCenterView />
		</AppShell>
	);
}

