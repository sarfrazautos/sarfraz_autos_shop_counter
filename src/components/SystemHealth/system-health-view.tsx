"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Activity,
	RefreshCw,
} from "lucide-react";
import { STORAGE_QUOTAS, BRANCH_NODES } from "./types";
import { StorageMetricsCards } from "./storage-metrics";
import { BranchConnectivitySection } from "./branch-connectivity";

export function SystemHealthView() {
	const [quotas] = useState(STORAGE_QUOTAS);
	const [nodes, setNodes] = useState(BRANCH_NODES);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastCheckTime, setLastCheckTime] = useState("Just now");

	const handleRefresh = () => {
		setIsRefreshing(true);
		setTimeout(() => {
			setIsRefreshing(false);
			const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			setLastCheckTime(`Today at ${now}`);

			// Simulate fresh latency jitter
			setNodes((prev) =>
				prev.map((n) => ({
					...n,
					lastSyncTime: "Just now",
					pingLatency: `${Math.floor(Math.random() * 10) + 15}ms`,
				}))
			);
		}, 600);
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-full min-w-0">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							System Health & Storage Architecture
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Free Plan Telemetry
						</Badge>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<Activity className="size-3.5 text-emerald-600" />
						<span>Postgres Database & Vercel Blob Media quotas across Sarfraz Autos branches</span>
						<span>•</span>
						<span>Checked: {lastCheckTime}</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="gap-2 cursor-pointer"
					>
						<RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
						Refresh Telemetry
					</Button>
				</div>
			</div>

			{/* 3 Storage Metric Cards */}
			<StorageMetricsCards quotas={quotas} />

			{/* Branch Counter Connectivity Status Cards */}
			<BranchConnectivitySection nodes={nodes} />
		</div>
	);
}

