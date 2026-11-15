"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchRiders, type RiderItem } from "@/lib/api/riders/riders-api";
import {
    MapControls,
    MapMarker,
    MapMarkerContent,
    MapMarkerPopup,
    MapMarkerTooltip,
    MapView,
} from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { Bike, Store, Phone, Navigation } from "lucide-react";

const BRANCH_LOCATIONS = [
    {
        id: "branch-saddar",
        name: "1st Branch (Saddar Main Workshop)",
        address: "Shop #23 Taj Mahal Qasim Auto Market, Saddar",
        latitude: 24.8607,
        longitude: 67.0105,
    },
    {
        id: "branch-gulshan",
        name: "2nd Branch (Gulshan Auto Hub)",
        address: "Plot 14-C, Block 13-D, Gulshan-e-Iqbal",
        latitude: 24.9205,
        longitude: 67.0945,
    },
    {
        id: "branch-dha",
        name: "3rd Branch (DHA Express Counter)",
        address: "Commercial Area B, Phase 2, DHA",
        latitude: 24.8315,
        longitude: 67.0654,
    },
];

interface MapDemoProps {
    className?: string;
}

export default function MapDemo({ className = "h-96 rounded-lg border" }: MapDemoProps) {
    const { data: ridersData } = useQuery({
        queryKey: queryKeys.riders.all,
        queryFn: () => fetchRiders(),
        refetchInterval: 1000 * 5, // poll location every 5s
        staleTime: 1000 * 3,
    });

    const riders: RiderItem[] = ridersData?.data || [];

    return (
        <MapView
            className={className}
            defaultViewport={{ center: [67.025, 24.875], zoom: 11.5 }}
        >
            {/* 3 Physical Branches */}
            {BRANCH_LOCATIONS.map((b) => (
                <MapMarker
                    key={b.id}
                    label={b.name}
                    latitude={b.latitude}
                    longitude={b.longitude}
                >
                    <MapMarkerContent className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-white">
                        <Store className="size-4" />
                    </MapMarkerContent>
                    <MapMarkerTooltip>{b.name}</MapMarkerTooltip>
                    <MapMarkerPopup>
                        <div className="p-2 space-y-1 text-xs">
                            <p className="font-bold text-foreground">{b.name}</p>
                            <p className="text-muted-foreground">{b.address}</p>
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                                Main Godown / Counter
                            </Badge>
                        </div>
                    </MapMarkerPopup>
                </MapMarker>
            ))}

            {/* Delivery Fleet Riders */}
            {riders.map((r) => (
                <MapMarker
                    key={r.id}
                    label={r.name}
                    latitude={r.lat}
                    longitude={r.lng}
                >
                    <MapMarkerContent
                        className={`p-1.5 rounded-full shadow-lg border-2 border-white ${
                            r.status === "en_route_delivery"
                                ? "bg-amber-500 text-white animate-bounce"
                                : "bg-emerald-600 text-white"
                        }`}
                    >
                        <Bike className="size-4" />
                    </MapMarkerContent>
                    <MapMarkerTooltip>
                        {r.name} ({r.vehicle})
                    </MapMarkerTooltip>
                    <MapMarkerPopup>
                        <div className="p-2 space-y-1.5 text-xs min-w-[180px]">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-foreground">{r.name}</span>
                                <Badge
                                    className={`text-[9px] px-1.5 py-0 ${
                                        r.status === "en_route_delivery"
                                            ? "bg-amber-500/15 text-amber-700"
                                            : "bg-emerald-500/15 text-emerald-700"
                                    }`}
                                    variant="outline"
                                >
                                    {r.status === "en_route_delivery" ? "En Route" : "Idle / Available"}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground flex items-center gap-1">
                                <Phone className="size-3" /> {r.phone}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                                Vehicle: <strong>{r.vehicle}</strong>
                            </p>
                            {r.destinationName && (
                                <div className="pt-1 border-t text-[11px]">
                                    <span className="text-muted-foreground">Delivering to:</span>
                                    <p className="font-semibold text-foreground flex items-center gap-1">
                                        <Navigation className="size-3 text-primary" />
                                        {r.destinationName} ({r.destinationCity})
                                    </p>
                                </div>
                            )}
                        </div>
                    </MapMarkerPopup>
                </MapMarker>
            ))}

            <MapControls />
        </MapView>
    );
}
