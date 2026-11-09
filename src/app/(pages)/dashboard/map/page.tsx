import { AppShell } from "@/components/app-shell";
import MapDemo from "@/components/Map/Map";
import { Card, CardContent } from "@/components/ui/card";

export default function MapPage() {
	return (
		<AppShell pathname="/dashboard/map">
			<div className="flex flex-col gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Map Tracking</h1>
					<p className="text-muted-foreground text-sm">
						Real-time dispatch, route monitoring, and delivery tracking.
					</p>
				</div>
				<Card className="overflow-hidden p-0 border">
					<CardContent className="p-0">
						<MapDemo className="h-[calc(100vh-14rem)] min-h-[550px] w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>
		</AppShell>
	);
}

