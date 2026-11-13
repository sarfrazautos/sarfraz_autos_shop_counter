import { AppShell } from "@/components/app-shell";
import { PriceUpdaterView } from "@/components/Products/price-updater-view";

export default function PriceUpdaterPage() {
	return (
		<AppShell pathname="/dashboard/products/price-updater">
			<PriceUpdaterView />
		</AppShell>
	);
}

