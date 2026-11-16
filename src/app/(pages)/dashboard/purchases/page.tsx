import { AppShell } from "@/components/app-shell";
import { PurchasesView } from "@/components/Purchases/purchases-view";

export default function PurchasesPage() {
	return (
		<AppShell pathname="/dashboard/purchases">
			<PurchasesView />
		</AppShell>
	);
}
