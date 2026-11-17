import { AppShell } from "@/components/app-shell";
import { TopSellingView } from "@/components/Reports/top-selling-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Most Selling Products & Sealed Orders | Sarfraz Autos",
	description:
		"Discover top selling spare parts, highest revenue generating items, and largest sealed orders across all periods.",
};

export default function TopSellingPage() {
	return (
		<AppShell pathname="/dashboard/reports/top-selling">
			<TopSellingView />
		</AppShell>
	);
}
