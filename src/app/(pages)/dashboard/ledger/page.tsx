import { AppShell } from "@/components/app-shell";
import { LedgerView } from "@/components/Ledger/ledger-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Customer Ledgers & Khata | Sarfraz Autos",
	description: "Customer running balances, debit/credit vouchers, opening balances, and account statements.",
};

export default function LedgerPage() {
	return (
		<AppShell pathname="/dashboard/ledger">
			<LedgerView />
		</AppShell>
	);
}
