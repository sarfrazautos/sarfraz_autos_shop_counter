import { AppShell } from "@/components/app-shell";
import { ProductsView } from "@/components/Products/products-view";

export default function AllProductsPage() {
	return (
		<AppShell pathname="/dashboard/products">
			<ProductsView />
		</AppShell>
	);
}

