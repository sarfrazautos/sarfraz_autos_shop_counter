import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Database,
	Image as ImageIcon,
	Zap,
} from "lucide-react";
import type { StorageQuota } from "./types";

interface StorageMetricsProps {
	quotas: StorageQuota[];
}

export function StorageMetricsCards({ quotas }: StorageMetricsProps) {
	const dbQuota = quotas.find((q) => q.service.includes("Database Storage")) ?? quotas[0];
	const blobQuota = quotas.find((q) => q.service.includes("Vercel Blob")) ?? quotas[1];
	const bandwidthQuota = quotas.find((q) => q.service.includes("Bandwidth")) ?? quotas[2] ?? quotas[0];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{/* 1. Database Storage (Neon Serverless PostgreSQL) */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex flex-col justify-between h-full gap-3">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2.5">
							<div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
								<Database className="size-4" />
							</div>
							<div>
								<h3 className="font-semibold text-xs text-foreground">Postgres Database Storage</h3>
								<p className="text-[11px] text-muted-foreground">Neon Serverless (512 MB Free)</p>
							</div>
						</div>
						<Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0 font-medium">
							Live Neon
						</Badge>
					</div>

					<div className="space-y-1.5 pt-1">
						<div className="flex items-baseline justify-between text-xs">
							<span className="font-heading font-bold text-lg text-foreground">{dbQuota.usedFormatted}</span>
							<span className="text-muted-foreground font-mono text-[11px]">/ {dbQuota.limitFormatted}</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-500 transition-all duration-300"
								style={{ width: `${Math.max(2, Math.min(100, dbQuota.percentUsed))}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
							<span>{dbQuota.percentUsed}% used</span>
							<span className="font-medium text-foreground/80">{dbQuota.details}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 2. Vercel Blob Image Storage */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex flex-col justify-between h-full gap-3">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2.5">
							<div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
								<ImageIcon className="size-4" />
							</div>
							<div>
								<h3 className="font-semibold text-xs text-foreground">Vercel Blob Media</h3>
								<p className="text-[11px] text-muted-foreground">Product Photos & Catalog (1.0 GB)</p>
							</div>
						</div>
						<Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-0 font-medium">
							Blob Connected
						</Badge>
					</div>

					<div className="space-y-1.5 pt-1">
						<div className="flex items-baseline justify-between text-xs">
							<span className="font-heading font-bold text-lg text-foreground">{blobQuota.usedFormatted}</span>
							<span className="text-muted-foreground font-mono text-[11px]">/ {blobQuota.limitFormatted}</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-sky-500 transition-all duration-300"
								style={{ width: `${Math.max(1, Math.min(100, blobQuota.percentUsed))}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
							<span>{blobQuota.percentUsed}% used</span>
							<span className="font-medium text-foreground/80">{blobQuota.details}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 3. Edge Bandwidth */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex flex-col justify-between h-full gap-3">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2.5">
							<div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
								<Zap className="size-4" />
							</div>
							<div>
								<h3 className="font-semibold text-xs text-foreground">Vercel Fast Edge CDN</h3>
								<p className="text-[11px] text-muted-foreground">100 GB Fast Data Delivery</p>
							</div>
						</div>
						<Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0 font-medium">
							Fast CDN
						</Badge>
					</div>

					<div className="space-y-1.5 pt-1">
						<div className="flex items-baseline justify-between text-xs">
							<span className="font-heading font-bold text-lg text-foreground">{bandwidthQuota.usedFormatted}</span>
							<span className="text-muted-foreground font-mono text-[11px]">/ {bandwidthQuota.limitFormatted}</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-amber-500 transition-all duration-300"
								style={{ width: `${bandwidthQuota.percentUsed}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
							<span>{bandwidthQuota.percentUsed}% consumed</span>
							<span className="font-medium text-foreground/80">{bandwidthQuota.details}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
