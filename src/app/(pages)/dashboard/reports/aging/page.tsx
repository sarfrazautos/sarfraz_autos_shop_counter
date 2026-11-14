import { AppShell } from "@/components/app-shell";
import { AgingReportView } from "@/components/Reports/aging-report-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Customer Aging Receivables Report | Sarfraz Autos",
	description: "Receivable of customers of all routes & age > 0 days, recovery salesmen tracking, and overdue aging brackets.",
};

export default function AgingReportPage() {
	return (
		<AppShell pathname="/dashboard/reports/aging">
			<AgingReportView />
		</AppShell>
	);
}
