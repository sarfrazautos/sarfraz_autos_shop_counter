import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { EditProductForm } from "@/components/Products/edit-product-form";
import { INITIAL_PRODUCTS } from "@/components/Products/types";

export function generateStaticParams() {
	return INITIAL_PRODUCTS.map((p) => ({
		id: p.id,
	}));
}

async function EditProductContent({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <EditProductForm productId={id} />;
}

export default function EditProductPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	return (
		<AppShell pathname="/dashboard/products">
			<Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading product details...</div>}>
				<EditProductContent params={params} />
			</Suspense>
		</AppShell>
	);
}
