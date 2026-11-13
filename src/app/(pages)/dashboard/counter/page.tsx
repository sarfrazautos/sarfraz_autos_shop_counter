import { AppShell } from "@/components/app-shell";
import { CounterView } from "@/components/Counter/counter-view";

export default function CounterPage() {
	return (
		<AppShell pathname="/dashboard/counter">
			<CounterView />
		</AppShell>
	);
}
