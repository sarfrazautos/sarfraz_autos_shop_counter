import { AppShell } from "@/components/app-shell";
import { TradeSchemesView } from "@/components/TradeSchemes/trade-schemes-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Trade Schemes & Bonus Promotions | Sarfraz Autos",
	description: "Manage wholesale trade schemes, 'Buy 20 Get 1 Free' bonus rules, and net scheme discount rates.",
};

export default function TradeSchemesPage() {
	return (
		<AppShell pathname="/dashboard/trade-schemes">
			<TradeSchemesView />
		</AppShell>
	);
}
