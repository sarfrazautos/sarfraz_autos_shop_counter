import { Skeleton } from "@/components/ui/skeleton";

export function TradeSchemeCardSkeleton() {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4 animate-in fade-in duration-300">
			{/* Top: Icon, Badges, Status */}
			<div className="space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						<Skeleton className="size-9 rounded-xl" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-28 rounded-md" />
							<Skeleton className="h-3 w-16 rounded" />
						</div>
					</div>
					<Skeleton className="h-5 w-14 rounded-full" />
				</div>

				{/* Title & Model */}
				<div className="space-y-1.5 pt-1">
					<Skeleton className="h-5 w-4/5 rounded-md" />
					<Skeleton className="h-3.5 w-3/5 rounded" />
				</div>

				{/* Highlight Rule Box */}
				<div className="rounded-xl border border-muted bg-muted/30 p-3 space-y-2.5">
					<Skeleton className="h-4 w-5/6 rounded" />
					<div className="grid grid-cols-2 gap-2 pt-2 border-t border-muted">
						<div className="space-y-1">
							<Skeleton className="h-3 w-20 rounded" />
							<Skeleton className="h-4 w-16 rounded" />
						</div>
						<div className="space-y-1">
							<Skeleton className="h-3 w-24 rounded" />
							<Skeleton className="h-4 w-16 rounded" />
						</div>
					</div>
				</div>

				{/* Bonus & Validity details */}
				<div className="space-y-2 pt-1 text-xs">
					<div className="flex justify-between items-center">
						<Skeleton className="h-3 w-24 rounded" />
						<Skeleton className="h-3 w-20 rounded" />
					</div>
					<div className="flex justify-between items-center">
						<Skeleton className="h-3 w-20 rounded" />
						<Skeleton className="h-3 w-28 rounded" />
					</div>
					<div className="flex justify-between items-center">
						<Skeleton className="h-3 w-32 rounded" />
						<Skeleton className="h-3 w-16 rounded" />
					</div>
					<div className="flex justify-between items-center">
						<Skeleton className="h-3 w-24 rounded" />
						<Skeleton className="h-3 w-28 rounded" />
					</div>
				</div>
			</div>

			{/* Card Footer Actions */}
			<div className="pt-4 border-t mt-4 flex items-center justify-between gap-2">
				<Skeleton className="h-7 w-20 rounded-md" />
				<Skeleton className="size-7 rounded-md" />
			</div>
		</div>
	);
}

export function TradeSchemesCardsSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: count }).map((_, idx) => (
				<TradeSchemeCardSkeleton key={idx} />
			))}
		</div>
	);
}

export function TradeSchemesSkeleton() {
	return (
		<div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-300">
			{/* Top Header Skeleton */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="flex items-center gap-3">
					<Skeleton className="size-11 rounded-xl" />
					<div className="space-y-1.5">
						<Skeleton className="h-6 w-64 rounded-md" />
						<Skeleton className="h-3.5 w-80 rounded" />
					</div>
				</div>
				<div className="flex items-center gap-2.5">
					<Skeleton className="h-9 w-36 rounded-lg" />
					<Skeleton className="h-9 w-28 rounded-lg" />
				</div>
			</div>

			{/* 3 Metric Cards Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
					<Skeleton className="h-3 w-32 rounded" />
					<Skeleton className="h-8 w-24 rounded-md" />
					<Skeleton className="h-3 w-48 rounded" />
				</div>
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
					<Skeleton className="h-3 w-32 rounded" />
					<Skeleton className="h-8 w-24 rounded-md" />
					<Skeleton className="h-3 w-48 rounded" />
				</div>
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
					<Skeleton className="h-3 w-36 rounded" />
					<Skeleton className="h-8 w-24 rounded-md" />
					<Skeleton className="h-3 w-48 rounded" />
				</div>
			</div>

			{/* Filter Toolbar Skeleton */}
			<div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-3 flex-1">
					<Skeleton className="h-8 w-56 rounded-lg" />
					<Skeleton className="h-8 w-44 rounded-lg" />
				</div>
				<Skeleton className="h-8 w-full sm:w-72 rounded-lg" />
			</div>

			{/* Schemes Cards Grid Skeleton */}
			<TradeSchemesCardsSkeleton count={6} />
		</div>
	);
}
