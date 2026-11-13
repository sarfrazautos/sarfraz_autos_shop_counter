import { AppShell } from "@/components/app-shell";
import { AddProductForm } from "@/components/Products/add-product-form";

export default function AddProductPage() {
	return (
		<AppShell pathname="/dashboard/products/add">
			<AddProductForm />
		</AppShell>
	);
}
