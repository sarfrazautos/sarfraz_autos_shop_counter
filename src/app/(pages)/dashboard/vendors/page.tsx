import { AppShell } from "@/components/app-shell";
import { VendorView } from "@/components/Vendors/vendor-view";

export default function VendorsPage() {
	return (
		<AppShell pathname="/dashboard/vendors">
			<VendorView />
		</AppShell>
	);
}
