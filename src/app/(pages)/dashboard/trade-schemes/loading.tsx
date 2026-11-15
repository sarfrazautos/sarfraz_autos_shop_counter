import { AppShell } from "@/components/app-shell";
import { TradeSchemesSkeleton } from "@/components/Skeletons/trade-schemes-skeleton";

export default function TradeSchemesLoading() {
	return (
		<AppShell pathname="/dashboard/trade-schemes">
			<TradeSchemesSkeleton />
		</AppShell>
	);
}
