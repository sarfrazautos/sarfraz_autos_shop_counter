"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
    MapPin,
    Navigation,
    AlertCircle,
    Phone,
    RefreshCw,
    ExternalLink,
    Play,
    Pause,
    Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RiderData {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    currentStatus: "idle" | "en_route_delivery" | "offline";
    currentLatitude: number;
    currentLongitude: number;
    lastPingAt: string;
    activeOrder: {
        id: string;
        invoiceNumber: string;
        customerName: string;
        customerPhone: string;
        customerCity: string;
        totalAmount: number;
        orderStatus: string;
    } | null;
}

function RiderTrackingContent() {
    const params = useParams();
    const riderId = (params?.id as string) || "";

    const [rider, setRider] = useState<RiderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [gpsErrorMsg, setGpsErrorMsg] = useState<string>("");
    
    // Live coordinates
    const [coords, setCoords] = useState<{
        lat: number;
        lng: number;
        accuracy: number | null;
        speed: number | null;
    } | null>(null);

    const [pingsSent, setPingsSent] = useState(0);
    const [lastPingTime, setLastPingTime] = useState<string | null>(null);
    const [activeStatus, setActiveStatus] = useState<"idle" | "en_route_delivery" | "offline">("idle");
    const [screenWakeLocked, setScreenWakeLocked] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);

    // Fetch initial rider data
    const fetchRiderProfile = async () => {
        if (!riderId) return;
        try {
            const res = await fetch(`/api/riders/${riderId}`);
            const json = await res.json();
            if (json.success && json.data) {
                setRider(json.data);
                setActiveStatus(json.data.currentStatus || "idle");
                setCoords({
                    lat: json.data.currentLatitude,
                    lng: json.data.currentLongitude,
                    accuracy: 10,
                    speed: 0,
                });
            }
        } catch (e) {
            console.error("Failed to fetch rider profile", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiderProfile();
    }, [riderId]);

    // Send location ping to server
    const transmitLocation = async (
        lat: number,
        lng: number,
        speedKmh: number = 0,
        statusOverride?: "idle" | "en_route_delivery" | "offline"
    ) => {
        if (!riderId) return;
        try {
            const statusToSend = statusOverride || activeStatus;
            const res = await fetch(`/api/riders/${riderId}/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lng,
                    speedKmh: Math.round(speedKmh * 10) / 10,
                    status: statusToSend,
                }),
            });

            if (res.ok) {
                setPingsSent((prev) => prev + 1);
                setLastPingTime(new Date().toLocaleTimeString("en-PK", { hour12: true }));
                if (typeof window !== "undefined" && "vibrate" in navigator) {
                    navigator.vibrate?.(40);
                }
            }
        } catch (err) {
            console.error("Failed to transmit GPS ping:", err);
        }
    };

    // Request Screen Wake Lock so phone doesn't sleep while riding
    const requestWakeLock = async () => {
        if (typeof window !== "undefined" && "wakeLock" in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
                setScreenWakeLocked(true);
            } catch (err) {
                console.warn("Wake Lock error:", err);
                setScreenWakeLocked(false);
            }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
            setScreenWakeLocked(false);
        }
    };

    // Start Live GPS Tracking via HTML5 Geolocation API
    const startTracking = () => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setGpsErrorMsg("Geolocation is not supported by your phone browser.");
            return;
        }

        setIsTracking(true);
        setGpsErrorMsg("");
        requestWakeLock();

        // 1. Immediate single location check
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy, speed } = pos.coords;
                const speedKmh = speed ? speed * 3.6 : 0;
                setCoords({ lat: latitude, lng: longitude, accuracy, speed: speedKmh });
                transmitLocation(latitude, longitude, speedKmh);
            },
            (err) => {
                console.warn("Initial geolocation fetch failed:", err);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        // 2. High-precision continuous watch
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const speedKmh = speed ? speed * 3.6 : 0;

                setCoords({
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    speed: speedKmh,
                });

                transmitLocation(latitude, longitude, speedKmh);
            },
            (error) => {
                console.error("GPS Watch error:", error);
                if (error.code === error.PERMISSION_DENIED) {
                    setGpsErrorMsg("Location permission denied. Please allow GPS access in your browser settings.");
                } else {
                    setGpsErrorMsg(error.message || "Unable to acquire GPS signal.");
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            }
        );

        watchIdRef.current = id;
    };

    // Stop tracking
    const stopTracking = () => {
        if (watchIdRef.current !== null && typeof window !== "undefined") {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        releaseWakeLock();

        if (coords) {
            transmitLocation(coords.lat, coords.lng, 0, "offline");
        }
    };

    const handleStatusChange = async (newStatus: "idle" | "en_route_delivery" | "offline") => {
        setActiveStatus(newStatus);
        if (coords) {
            transmitLocation(coords.lat, coords.lng, coords.speed || 0, newStatus);
        }
    };

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null && typeof window !== "undefined") {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            releaseWakeLock();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
                    <RefreshCw className="size-6 animate-spin text-primary" />
                </div>
                <h1 className="text-base font-bold text-slate-800">Connecting Rider Terminal...</h1>
                <p className="text-xs text-slate-500 mt-1">Sarfraz Autos Dispatch Gateway</p>
            </div>
        );
    }

    if (!rider) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4">
                    <AlertCircle className="size-7" />
                </div>
                <h1 className="text-base font-bold text-slate-900">Rider Not Found</h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Rider ID ({riderId}) is not registered in the system. Please verify with the counter manager.
                </p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
            {/* Transparent Header: Logo on left only */}
            <header className="w-full px-4 sm:px-6 py-4 flex items-center bg-transparent">
                <Image
                    src="/logo.png"
                    alt="Sarfraz Autos Logo"
                    width={38}
                    height={38}
                    className="object-contain"
                />
            </header>

            {/* Centered Content Area */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-6 w-full">
                <div className="max-w-md w-full space-y-4 my-auto">
                    {/* Rider Profile Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Assigned Rider
                            </span>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                                {rider.name}
                            </h2>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                <Phone className="size-3 text-primary" /> {rider.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                Bike Plate
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                                {rider.vehicleNumber}
                            </span>
                        </div>
                    </div>

                    {/* Segmented Work Status Controller */}
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-slate-600">
                                Current Status:
                            </span>
                            <span className="text-[10px] text-slate-400">Tap to switch</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={activeStatus === "idle" ? "default" : "outline"}
                                onClick={() => handleStatusChange("idle")}
                                className={cn(
                                    "h-9 text-xs font-medium",
                                    activeStatus === "idle"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "text-slate-700 bg-white hover:bg-slate-50"
                                )}
                            >
                                🟢 Available
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={activeStatus === "en_route_delivery" ? "default" : "outline"}
                                onClick={() => handleStatusChange("en_route_delivery")}
                                className={cn(
                                    "h-9 text-xs font-medium",
                                    activeStatus === "en_route_delivery"
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : "text-slate-700 bg-white hover:bg-slate-50"
                                )}
                            >
                                🛵 En Route
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={activeStatus === "offline" ? "default" : "outline"}
                                onClick={() => handleStatusChange("offline")}
                                className={cn(
                                    "h-9 text-xs font-medium",
                                    activeStatus === "offline"
                                        ? "bg-slate-700 hover:bg-slate-800 text-white"
                                        : "text-slate-700 bg-white hover:bg-slate-50"
                                )}
                            >
                                ⚪ Offline
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2">
                    {!isTracking ? (
                        <Button
                            onClick={startTracking}
                            className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                            <Play className="size-4 fill-current" />
                            <span>Start Live Tracking</span>
                        </Button>
                    ) : (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-3 rounded-full bg-emerald-500 animate-ping" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900">
                                            Tracking Active
                                        </p>
                                        <p className="text-[11px] text-emerald-700">
                                            Broadcasting GPS coordinates to counter map
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={stopTracking}
                                    className="h-8 text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 bg-white"
                                >
                                    <Pause className="size-3.5 mr-1" /> Pause
                                </Button>
                            </div>
                        </div>
                    )}

                    {screenWakeLocked && (
                        <div className="flex items-center justify-end px-1 text-[11px] text-amber-600 font-medium">
                            <span className="flex items-center gap-1">
                                <Sun className="size-3.5" />
                                Screen Awake
                            </span>
                        </div>
                    )}
                </div>

                {/* GPS Errors or Denied Notifications */}
                {gpsErrorMsg && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 flex items-start gap-2.5 shadow-2xs">
                        <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                        <div>
                            <p className="font-bold">GPS Permission Required</p>
                            <p className="text-[11px] text-red-600 mt-0.5">{gpsErrorMsg}</p>
                            <p className="text-[10px] text-red-500 mt-1">
                                Tip: Tap the 🔒 lock icon in Chrome address bar to Allow Location access.
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Delivery Destination (If any) */}
                {rider.activeOrder && (
                    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                                <Navigation className="size-3.5 text-amber-600" /> Active Delivery Assigned
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800 font-mono font-bold">
                                {rider.activeOrder.invoiceNumber}
                            </Badge>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-sm">{rider.activeOrder.customerName}</p>
                            <p className="text-slate-600 text-xs flex items-center gap-1 font-medium">
                                <MapPin className="size-3 text-amber-600" /> {rider.activeOrder.customerCity}
                            </p>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200/60">
                            <span className="text-slate-600">Cash to Collect:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                                Rs. {rider.activeOrder.totalAmount.toLocaleString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            {rider.activeOrder.customerPhone && (
                                <a
                                    href={`tel:${rider.activeOrder.customerPhone}`}
                                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-200 shadow-2xs transition-colors"
                                >
                                    <Phone className="size-3 text-emerald-600" /> Call
                                </a>
                            )}
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    rider.activeOrder.customerName + " " + rider.activeOrder.customerCity
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-2xs transition-colors"
                            >
                                <ExternalLink className="size-3" /> Open Maps
                            </a>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </main>
    );
}

export default function RiderTrackingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
                        <RefreshCw className="size-6 animate-spin text-primary" />
                    </div>
                    <h1 className="text-base font-bold text-slate-800">Connecting Rider Terminal...</h1>
                </div>
            }
        >
            <RiderTrackingContent />
        </Suspense>
    );
}
