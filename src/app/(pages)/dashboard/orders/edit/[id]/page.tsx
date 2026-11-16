import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { OrderEditForm } from "./order-edit-form";

export function generateStaticParams() {
	return [
		{ id: "SA-37376" },
	];
}

async function OrderEditContent({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <OrderEditForm orderId={id} />;
}

export default function OrderEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	return (
		<AppShell pathname="/dashboard/orders">
			<Suspense
				fallback={
					<div className="p-12 text-center text-xs text-muted-foreground">
						Loading order edit form...
					</div>
				}
			>
				<OrderEditContent params={params} />
			</Suspense>
		</AppShell>
	);
}
