"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Store,
	Building2,
	MapPin,
	Activity,
	Radio,
	Wifi,
	RefreshCw,
	CheckCircle2,
	Clock,
	Layers,
	Receipt,
	Users,
} from "lucide-react";
import type { BranchNodeStatus } from "./types";

interface BranchConnectivityProps {
	nodes: BranchNodeStatus[];
	onPingNode?: (id: string) => void;
}

export function BranchConnectivitySection({ nodes }: BranchConnectivityProps) {
	return (
		<div className="space-y-3">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-base font-semibold font-heading text-foreground">
							Live Branch Counter Connectivity & Sync
						</h2>
						<Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
							3 of 3 Terminals Online
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						Real-time socket heartbeat and Postgres transaction sync across Sarfraz Autos retail outlets.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{nodes.map((node) => {
					const isMain = node.id === "main";
					const isBranch2 = node.id === "branch-2";

					return (
						<Card
							key={node.id}
							className="rounded-xl border bg-card shadow-2xs hover:shadow-xs transition-all duration-200 overflow-hidden flex flex-col justify-between"
						>
							<CardHeader className="p-4 pb-3 border-b bg-muted/20">
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2.5">
										<div
											className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${
												isMain
													? "bg-emerald-500/10 text-emerald-600"
													: isBranch2
													? "bg-sky-500/10 text-sky-600"
													: "bg-amber-500/10 text-amber-600"
											}`}
										>
											{isMain ? (
												<Store className="size-4" />
											) : isBranch2 ? (
												<Building2 className="size-4" />
											) : (
												<MapPin className="size-4" />
											)}
										</div>
										<div className="min-w-0">
											<h3 className="font-semibold text-sm text-foreground truncate">
												{node.branchName}
											</h3>
											<p className="text-[11px] text-muted-foreground truncate">
												{node.tagline}
											</p>
										</div>
									</div>

									{/* Status pill with pulsating ping dot */}
									<Badge
										className="border-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium text-[11px] shrink-0"
										variant="outline"
									>
										<span className="flex size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
										Online
									</Badge>
								</div>
							</CardHeader>

							<CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
								{/* Terminal Info */}
								<div className="space-y-1">
									<p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Wifi className="size-3.5 text-muted-foreground" />
										{node.counterName}
									</p>
									<p className="text-[11px] text-muted-foreground font-mono">
										Local Gateway: {node.ipAddress}
									</p>
								</div>

								{/* Metrics Grid */}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col justify-between">
										<span className="text-[11px] text-muted-foreground flex items-center gap-1">
											<Activity className="size-3 text-emerald-600" /> Ping Latency
										</span>
										<span className="font-heading font-bold text-sm text-emerald-600 mt-1">
											{node.pingLatency}
										</span>
									</div>

									<div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col justify-between">
										<span className="text-[11px] text-muted-foreground flex items-center gap-1">
											<Receipt className="size-3 text-sky-600" /> Today Invoices
										</span>
										<span className="font-heading font-bold text-sm text-foreground mt-1">
											{node.todayTransactions} sales
										</span>
									</div>
								</div>

								{/* Sync Health & Footer */}
								<div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
									<div className="flex items-center gap-1.5">
										<Clock className="size-3" />
										<span>Synced {node.lastSyncTime}</span>
									</div>
									<div className="flex items-center gap-1 text-foreground font-medium">
										<Users className="size-3 text-muted-foreground" />
										<span>{node.activeStaffCount} staff active</span>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}

