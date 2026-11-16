import { AppShell } from "@/components/app-shell";
import { PurchaseEntryForm } from "@/components/Purchases/purchase-entry-form";

export default function NewPurchasePage() {
	return (
		<AppShell pathname="/dashboard/purchases">
			<PurchaseEntryForm />
		</AppShell>
	);
}
