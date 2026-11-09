import { AppShell } from "@/components/app-shell";
import { OrderView } from "@/components/Orders/order-view";

export default function OrdersPage() {
	return (
		<AppShell pathname="/dashboard/orders">
			<OrderView />
		</AppShell>
	);
}

