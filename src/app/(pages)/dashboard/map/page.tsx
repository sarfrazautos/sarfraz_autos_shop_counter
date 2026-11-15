import { AppShell } from "@/components/app-shell";
import MapDemo from "@/components/Map/Map";
import { RiderDispatchPanel } from "@/components/Map/rider-dispatch-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function MapPage() {
	return (
		<AppShell pathname="/dashboard/map">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Live Fleet & Rider Map</h1>
						<p className="text-muted-foreground text-sm">
							Real-time delivery tracking across Karachi, WhatsApp dispatch links, and workshop branches.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
					{/* Live Map View */}
					<Card className="lg:col-span-2 overflow-hidden p-0 border shadow-sm">
						<CardContent className="p-0">
							<MapDemo className="h-[calc(100vh-14rem)] min-h-[560px] w-full rounded-lg" />
						</CardContent>
					</Card>

					{/* Rider Dispatch & Tracking Links Control */}
					<div className="lg:col-span-1 space-y-4">
						<RiderDispatchPanel />
					</div>
				</div>
			</div>
		</AppShell>
	);
}
