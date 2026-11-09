import { AppShell } from "@/components/app-shell";
import { TeamView } from "@/components/Team/team-view";

export default function TeamPage() {
	return (
		<AppShell pathname="/dashboard/team">
			<TeamView />
		</AppShell>
	);
}
