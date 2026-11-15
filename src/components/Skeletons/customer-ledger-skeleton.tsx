import { Skeleton } from "@/components/ui/skeleton";

export function CustomerLedgerSkeleton() {
	return (
		<div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-300">
			{/* Top Header & Search/Action Bar Skeleton */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="flex items-center gap-3">
					<Skeleton className="size-11 rounded-xl shrink-0" />
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-60 rounded-md" />
							<Skeleton className="h-4 w-20 rounded-full" />
						</div>
						<Skeleton className="h-3.5 w-80 rounded" />
					</div>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
					<Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
					<Skeleton className="h-9 w-32 rounded-lg" />
					<div className="flex items-center gap-2 shrink-0">
						<Skeleton className="h-9 w-28 rounded-lg" />
						<Skeleton className="h-9 w-24 rounded-lg" />
					</div>
				</div>
			</div>

			{/* Customer Profile Header Card Skeleton */}
			<div className="rounded-2xl border bg-gradient-to-r from-card to-muted/20 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2.5">
						<Skeleton className="h-7 w-52 rounded-md" />
						<Skeleton className="h-5 w-20 rounded-full" />
					</div>
					<div className="flex flex-wrap items-center gap-4 pt-1">
						<Skeleton className="h-3.5 w-36 rounded" />
						<Skeleton className="h-3.5 w-44 rounded" />
						<Skeleton className="h-3.5 w-32 rounded" />
					</div>
				</div>

				{/* Financial Summary Badges */}
				<div className="flex items-center gap-3 flex-wrap">
					<div className="rounded-xl border bg-card/80 p-3 min-w-[130px] space-y-1">
						<Skeleton className="h-2.5 w-20 rounded" />
						<Skeleton className="h-6 w-24 rounded" />
					</div>
					<div className="rounded-xl border bg-card/80 p-3 min-w-[130px] space-y-1">
						<Skeleton className="h-2.5 w-20 rounded" />
						<Skeleton className="h-6 w-24 rounded" />
					</div>
					<div className="rounded-xl border bg-card/80 p-3 min-w-[130px] space-y-1">
						<Skeleton className="h-2.5 w-20 rounded" />
						<Skeleton className="h-6 w-24 rounded" />
					</div>
				</div>
			</div>

			{/* Filter Toolbar Skeleton */}
			<div className="rounded-2xl border bg-card p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 flex-1">
					<Skeleton className="h-8.5 w-48 rounded-lg" />
					<Skeleton className="h-8.5 w-36 rounded-lg" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-8.5 w-24 rounded-lg" />
					<Skeleton className="h-8.5 w-24 rounded-lg" />
				</div>
			</div>

			{/* Transactions Table Skeleton */}
			<div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
				<div className="p-4 border-b bg-muted/20 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Skeleton className="size-4 rounded" />
						<Skeleton className="h-4 w-40 rounded" />
					</div>
					<Skeleton className="h-4 w-28 rounded" />
				</div>

				<div className="divide-y divide-border/40">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="p-4 flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<Skeleton className="size-8 rounded-lg shrink-0" />
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-36 rounded" />
									<Skeleton className="h-3 w-48 rounded" />
								</div>
							</div>
							<div className="flex items-center gap-8">
								<div className="space-y-1 text-right">
									<Skeleton className="h-4 w-20 rounded ml-auto" />
									<Skeleton className="h-3 w-16 rounded ml-auto" />
								</div>
								<div className="space-y-1 text-right">
									<Skeleton className="h-4 w-20 rounded ml-auto" />
									<Skeleton className="h-3 w-14 rounded ml-auto" />
								</div>
								<div className="space-y-1 text-right">
									<Skeleton className="h-5 w-24 rounded ml-auto" />
									<Skeleton className="h-3 w-16 rounded ml-auto" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
