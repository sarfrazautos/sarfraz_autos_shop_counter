"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TopSellingSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* KPI Cards Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="p-5 rounded-2xl border bg-card/60 space-y-3"
					>
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-28 rounded-md" />
							<Skeleton className="size-8 rounded-xl" />
						</div>
						<Skeleton className="h-6 w-3/4 rounded-md" />
						<div className="flex items-center justify-between pt-1">
							<Skeleton className="h-4 w-20 rounded-md" />
							<Skeleton className="h-4 w-14 rounded-md" />
						</div>
					</div>
				))}
			</div>

			{/* Main Content Skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Table Skeleton (2 cols) */}
				<div className="lg:col-span-2 rounded-2xl border bg-card/60 p-5 space-y-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 w-44 rounded-md" />
						<Skeleton className="h-8 w-28 rounded-xl" />
					</div>
					<div className="space-y-3 pt-2">
						{[1, 2, 3, 4, 5, 6, 7].map((row) => (
							<div
								key={row}
								className="flex items-center justify-between p-3 rounded-xl border bg-muted/20"
							>
								<div className="flex items-center gap-3">
									<Skeleton className="size-8 rounded-full" />
									<div className="space-y-1.5">
										<Skeleton className="h-4 w-48 rounded-md" />
										<Skeleton className="h-3 w-28 rounded-md" />
									</div>
								</div>
								<div className="flex items-center gap-6">
									<Skeleton className="h-4 w-16 rounded-md" />
									<Skeleton className="h-4 w-24 rounded-md" />
									<Skeleton className="h-6 w-16 rounded-lg" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Right Side Cards Skeleton (1 col) */}
				<div className="space-y-6">
					<div className="rounded-2xl border bg-card/60 p-5 space-y-4">
						<Skeleton className="h-5 w-36 rounded-md" />
						<div className="space-y-3">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="p-3 rounded-xl border bg-muted/20 space-y-2">
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-24 rounded-md" />
										<Skeleton className="h-4 w-20 rounded-md" />
									</div>
									<Skeleton className="h-3 w-32 rounded-md" />
								</div>
							))}
						</div>
					</div>

					<div className="rounded-2xl border bg-card/60 p-5 space-y-3">
						<Skeleton className="h-5 w-40 rounded-md" />
						<div className="space-y-2.5">
							{[1, 2, 3].map((i) => (
								<div key={i} className="space-y-1">
									<div className="flex justify-between">
										<Skeleton className="h-3 w-24 rounded-md" />
										<Skeleton className="h-3 w-16 rounded-md" />
									</div>
									<Skeleton className="h-2 w-full rounded-full" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
