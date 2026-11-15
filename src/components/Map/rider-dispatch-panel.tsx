"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchRiders, addRider, deleteRider, type RiderItem } from "@/lib/api/riders/riders-api";
import {
    Bike,
    Phone,
    Copy,
    Check,
    Plus,
    ExternalLink,
    RefreshCw,
    Send,
    Navigation,
    Clock,
    UserCheck,
    Radio,
    Trash2,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function RiderDispatchPanel() {
    const queryClient = useQueryClient();
    const [copiedRiderId, setCopiedRiderId] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form state for adding new rider
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");

    const {
        data: ridersData,
        isLoading,
        isRefetching,
        refetch,
    } = useQuery({
        queryKey: queryKeys.riders.all,
        queryFn: () => fetchRiders(),
        refetchInterval: 5000, // poll every 5s for live updates
    });

    const riders: RiderItem[] = ridersData?.data || [];

    const addRiderMutation = useMutation({
        mutationFn: addRider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.riders.all });
            setIsAddOpen(false);
            setName("");
            setPhone("");
            setVehicleNumber("");
            toast.add({
                title: "Rider Added",
                description: "New delivery rider registered into fleet.",
                type: "success",
            });
        },
        onError: (err: any) => {
            toast.add({
                title: "Failed to Add Rider",
                description: err.message || "An error occurred",
                type: "error",
            });
        },
    });

    const [riderToDelete, setRiderToDelete] = useState<RiderItem | null>(null);

    const deleteRiderMutation = useMutation({
        mutationFn: (riderId: string) => deleteRider(riderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.riders.all });
            setRiderToDelete(null);
            toast.add({
                title: "Rider Deleted",
                description: "Delivery rider removed from fleet.",
                type: "success",
            });
        },
        onError: (err: any) => {
            toast.add({
                title: "Failed to Delete Rider",
                description: err.message || "An error occurred",
                type: "error",
            });
        },
    });

    const handleCopyLink = (rider: RiderItem) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/rider/${rider.id}`;
        navigator.clipboard.writeText(url);
        setCopiedRiderId(rider.id);
        setTimeout(() => setCopiedRiderId(null), 2500);

        toast.add({
            title: "Tracking Link Copied!",
            description: `Copied link for ${rider.name}. Share via WhatsApp or SMS.`,
            type: "success",
        });
    };

    const handleWhatsAppLink = (rider: RiderItem) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const link = `${origin}/rider/${rider.id}`;
        const cleanPhone = rider.phone.replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("0")
            ? `92${cleanPhone.slice(1)}`
            : cleanPhone;

        const message = encodeURIComponent(
            `Assalam-o-Alaikum ${rider.name},\n\nPlease open your Sarfraz Autos Live Delivery Tracking link and tap "START LIVE TRACKING":\n👉 ${link}\n\nKeep this tab open while on delivery.`
        );

        window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
    };

    const handleCreateRider = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !vehicleNumber.trim()) {
            toast.add({
                title: "Missing Fields",
                description: "Name, phone, and vehicle number are required.",
                type: "error",
            });
            return;
        }

        addRiderMutation.mutate({
            name: name.trim(),
            phone: phone.trim(),
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            currentStatus: "idle",
        });
    };

    return (
        <Card className="flex flex-col border shadow-sm">
            <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Bike className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            Fleet Dispatch
                            {isRefetching && (
                                <RefreshCw className="size-3 animate-spin text-muted-foreground" />
                            )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {riders.length} Registered Rider{riders.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => refetch()}
                        title="Refresh fleet positions"
                    >
                        <RefreshCw className="size-4" />
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger
                            render={
                                <Button size="sm" className="h-8 gap-1.5 text-xs">
                                    <Plus className="size-3.5" />
                                    Add Rider
                                </Button>
                            }
                        />
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleCreateRider}>
                                <DialogHeader>
                                    <DialogTitle>Register Delivery Rider</DialogTitle>
                                    <DialogDescription>
                                        Add a new motorcycle delivery rider to dispatch orders and track live coordinates.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3.5 py-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="rider-name">Rider Full Name *</Label>
                                        <Input
                                            id="rider-name"
                                            placeholder="e.g. Tariq Mehmood"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="rider-phone">WhatsApp / Mobile Number *</Label>
                                        <Input
                                            id="rider-phone"
                                            placeholder="e.g. 0300-1234567"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="rider-vehicle">Motorcycle Registration / Plate *</Label>
                                        <Input
                                            id="rider-vehicle"
                                            placeholder="e.g. KHI-8891"
                                            value={vehicleNumber}
                                            onChange={(e) => setVehicleNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={addRiderMutation.isPending}>
                                        {addRiderMutation.isPending ? "Registering..." : "Save Rider"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="p-3 divide-y overflow-y-auto max-h-[500px]">
                {isLoading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Loading riders...
                    </div>
                ) : riders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                        No delivery riders registered yet. Click &quot;Add Rider&quot; above.
                    </div>
                ) : (
                    riders.map((r) => {
                        const isEnRoute = r.status === "en_route_delivery";
                        const isIdle = r.status === "idle";

                        return (
                            <div key={r.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {r.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 ${
                                                    isEnRoute
                                                        ? "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold"
                                                        : isIdle
                                                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {isEnRoute ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                                                        En Route
                                                    </span>
                                                ) : isIdle ? (
                                                    "Available"
                                                ) : (
                                                    "Offline"
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Phone className="size-3 text-primary" /> {r.phone}
                                            </span>
                                            <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                                                {r.vehicle}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="size-3" />
                                        <span>Ping: {r.lastPing}</span>
                                    </div>
                                </div>

                                {/* Active delivery if any */}
                                {r.destinationName && (
                                    <div className="bg-primary/5 border border-primary/15 rounded-md p-2 text-xs flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Navigation className="size-3.5 text-primary shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {r.destinationName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {r.destinationCity} {r.activeInvoiceNumber ? `• ${r.activeInvoiceNumber}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons: Copy Link, WhatsApp, Test Portal */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1 px-2 cursor-pointer"
                                        onClick={() => handleCopyLink(r)}
                                        title="Copy Rider GPS tracking link"
                                    >
                                        {copiedRiderId === r.id ? (
                                            <>
                                                <Check className="size-3 text-emerald-600" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3" />
                                                <span>Copy Link</span>
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1 px-2 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                                        onClick={() => handleWhatsAppLink(r)}
                                        title="Send tracking link via WhatsApp"
                                    >
                                        <Send className="size-3 text-emerald-600" />
                                        <span>WhatsApp</span>
                                    </Button>

                                    <a
                                        href={`/rider/${r.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center h-7 text-[11px] gap-1 px-2 rounded-md border border-input bg-background hover:bg-accent text-foreground hover:text-accent-foreground font-medium transition-colors"
                                        title="Open rider phone view in new tab to test GPS"
                                    >
                                        <ExternalLink className="size-3" />
                                        <span>Open App</span>
                                    </a>
                                </div>

                                {/* Full Width Delete Rider Button (shadcn destructive) */}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full h-7 text-[11px] gap-1.5 cursor-pointer font-normal"
                                    onClick={() => setRiderToDelete(r)}
                                >
                                    <Trash2 className="size-3" />
                                    <span>Delete Rider</span>
                                </Button>
                            </div>
                        );
                    })
                )}
            </CardContent>

            {/* Delete Rider Confirmation Dialog */}
            <AlertDialog
                open={!!riderToDelete}
                onOpenChange={(open) => !open && setRiderToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
                            <AlertTriangle className="size-5" />
                        </div>
                        <AlertDialogTitle>Are you sure you want to delete this rider?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <span className="font-semibold text-foreground">{riderToDelete?.name}</span> ({riderToDelete?.vehicle || "Rider"}) from the delivery fleet.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRiderToDelete(null)} className="cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (riderToDelete) {
                                    deleteRiderMutation.mutate(riderToDelete.id);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
                        >
                            {deleteRiderMutation.isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                    Deleting...
                                </>
                            ) : (
                                "Yes, Delete Rider"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
