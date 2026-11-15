"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
    Bike,
    MapPin,
    Navigation,
    Radio,
    AlertCircle,
    Phone,
    RefreshCw,
    ExternalLink,
    Play,
    Pause,
    ShieldCheck,
    Sparkles,
    Gauge,
    Clock,
    Sun,
    CheckCircle2,
    Copy,
    Share2,
    Check,
} from "lucide-react";
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
    const [isSimulating, setIsSimulating] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
            setIsSimulating(false);
        }
        setIsTracking(false);
        releaseWakeLock();

        if (coords) {
            transmitLocation(coords.lat, coords.lng, 0, "offline");
        }
    };

    // Simulated test route in Karachi (Saddar -> Clifton -> DHA)
    const toggleSimulation = () => {
        if (isSimulating) {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
            setIsSimulating(false);
            setIsTracking(false);
            return;
        }

        setIsSimulating(true);
        setIsTracking(true);
        setGpsErrorMsg("");

        let step = 0;
        const waypoints = [
            { lat: 24.8607, lng: 67.0105, speed: 25 },
            { lat: 24.8550, lng: 67.0200, speed: 32 },
            { lat: 24.8480, lng: 67.0320, speed: 40 },
            { lat: 24.8390, lng: 67.0450, speed: 45 },
            { lat: 24.8280, lng: 67.0580, speed: 38 },
            { lat: 24.8190, lng: 67.0680, speed: 30 },
            { lat: 24.8110, lng: 67.0750, speed: 15 },
        ];

        simulationIntervalRef.current = setInterval(() => {
            const wp = waypoints[step % waypoints.length];
            setCoords({
                lat: wp.lat,
                lng: wp.lng,
                accuracy: 5,
                speed: wp.speed,
            });
            transmitLocation(wp.lat, wp.lng, wp.speed, "en_route_delivery");
            step++;
        }, 4000);
    };

    const handleStatusChange = async (newStatus: "idle" | "en_route_delivery" | "offline") => {
        setActiveStatus(newStatus);
        if (coords) {
            transmitLocation(coords.lat, coords.lng, coords.speed || 0, newStatus);
        }
    };

    const handleCopyUrl = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null && typeof window !== "undefined") {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
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
        <main className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col pb-16 font-sans">
            {/* Minimalist Top App Bar */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="relative size-10 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-center shadow-2xs">
                        <Image
                            src="/logo.png"
                            alt="Sarfraz Autos"
                            width={36}
                            height={36}
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900">
                                SARFRAZ AUTOS
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                SADDAR
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Delivery Fleet Terminal</p>
                    </div>
                </div>

                {/* Minimalist Live Pill */}
                {isTracking ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium shadow-2xs">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-bold">LIVE STREAM</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 text-slate-500 text-xs px-2.5 py-1 rounded-full font-medium">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        <span className="text-[11px]">STANDBY</span>
                    </div>
                )}
            </header>

            <div className="max-w-md w-full mx-auto p-4 space-y-4">
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
                                Current Status / حالت منتخب کریں:
                            </span>
                            <span className="text-[10px] text-slate-400">Tap to switch</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => handleStatusChange("idle")}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                                    activeStatus === "idle"
                                        ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <span className="block text-[11px]">🟢 Available</span>
                                <span className="block text-[10px] font-normal text-slate-500">دستیاب</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusChange("en_route_delivery")}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                                    activeStatus === "en_route_delivery"
                                        ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <span className="block text-[11px]">🛵 En Route</span>
                                <span className="block text-[10px] font-normal text-slate-500">راستے میں</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusChange("offline")}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                                    activeStatus === "offline"
                                        ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <span className="block text-[11px]">⚪ Offline</span>
                                <span className="block text-[10px] font-normal text-slate-500">آف لائن</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Primary Action Button (White/Light Minimalist Hero) */}
                <div className="space-y-2">
                    {!isTracking ? (
                        <Button
                            onClick={startTracking}
                            className="w-full h-14 text-sm sm:text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm border border-primary/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <Play className="size-5 fill-current" />
                            <span>START LIVE TRACKING (شروع کریں)</span>
                        </Button>
                    ) : (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-3 rounded-full bg-emerald-500 animate-ping" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900">
                                            Tracking Active (لوکیشن آن ہے)
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

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="size-3.5 text-emerald-600" />
                            Counter Encrypted & Secure
                        </span>
                        {screenWakeLocked && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Sun className="size-3.5" />
                                Screen Awake
                            </span>
                        )}
                    </div>
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

                {/* Telemetry Stats Grid (White Minimalist Cards) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Radio className="size-3.5 text-primary" /> Live Telemetry
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Standby"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                                <Gauge className="size-3 text-slate-400" /> Speed
                            </span>
                            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                                {coords?.speed ? `${Math.round(coords.speed)}` : "0"}
                                <span className="text-xs font-normal text-slate-500 ml-1">km/h</span>
                            </span>
                        </div>

                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                                <Navigation className="size-3 text-slate-400" /> GPS Accuracy
                            </span>
                            <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
                                {coords?.accuracy ? `±${Math.round(coords.accuracy)}m` : "--"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 block">Pings Sent</span>
                            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                                {pingsSent} packets
                            </span>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 block">Last Synced</span>
                            <span className="font-mono font-medium text-slate-800 text-xs mt-0.5 block truncate">
                                {lastPingTime || "Not yet sent"}
                            </span>
                        </div>
                    </div>

                    {/* Test Ride Simulator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px]">
                            <span className="text-slate-800 font-semibold block">Demo Simulation</span>
                            <span className="text-[10px] text-slate-500">Test route animation across Karachi</span>
                        </div>
                        <Button
                            size="sm"
                            variant={isSimulating ? "destructive" : "outline"}
                            onClick={toggleSimulation}
                            className="text-xs h-8 gap-1.5 font-medium rounded-lg"
                        >
                            <Sparkles className="size-3 text-amber-500" />
                            {isSimulating ? "Stop Sim" : "Simulate Ride"}
                        </Button>
                    </div>
                </div>

                {/* Quick Share Link & Rider Guidance */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Rider Portal Link</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyUrl}
                            className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900"
                        >
                            {copiedLink ? (
                                <>
                                    <Check className="size-3 text-emerald-600" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3" />
                                    <span>Copy URL</span>
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1 border border-slate-200/60">
                        <p className="font-medium text-slate-800">ہدایات برائے رائیڈر (Instructions):</p>
                        <p>1. موٹر سائیکل چلاتے وقت اس پیج کو بند نہ کریں۔</p>
                        <p>2. ڈلیوری مکمل ہونے پر اسٹیٹس &quot;Available&quot; یا &quot;Pause&quot; کر دیں۔</p>
                    </div>
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
