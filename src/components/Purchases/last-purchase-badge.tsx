"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { History, Sparkles, Loader2, Gift, Zap } from "lucide-react";
import type { LastPurchaseRateInfo } from "./types";

interface LastPurchaseBadgeProps {
	productId: string;
	className?: string;
}

export function LastPurchaseBadge({ productId, className = "" }: LastPurchaseBadgeProps) {
	const [info, setInfo] = useState<LastPurchaseRateInfo | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!productId) return;
		let isMounted = true;
		setIsLoading(true);

		fetch(`/api/purchases/last-rate?productId=${encodeURIComponent(productId)}`)
			.then((res) => res.json())
			.then((data) => {
				if (isMounted) {
					if (data.hasHistory) {
						setInfo(data);
					} else {
						setInfo(null);
					}
				}
			})
			.catch((err) => {
				console.error("Failed to load last purchase rate:", err);
			})
			.finally(() => {
				if (isMounted) setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [productId]);

	if (isLoading) {
		return (
			<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
				<Loader2 className="size-2.5 animate-spin" />
				<span>Checking past purchase...</span>
			</span>
		);
	}

	if (!info || !info.hasHistory) {
		return null;
	}

	const dateStr = info.purchaseDate
		? new Date(info.purchaseDate).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "2-digit",
		  })
		: "";

	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 text-[10px] shadow-2xs ${className}`}
			title={`Admin Reference: Last purchased from ${info.vendorName || "supplier"} on ${dateStr}`}
		>
			<History className="size-3 text-amber-600 shrink-0" />
			<span className="font-semibold">Last Purchase:</span>
			<span className="font-mono font-black text-amber-700 dark:text-amber-300">
				Rs. {info.lastRate?.toLocaleString()}
			</span>
			{info.schemeNote && (
				<span className="font-bold bg-amber-500/20 px-1 rounded text-[9px] flex items-center gap-0.5">
					{info.isNetScheme ? (
						<Zap className="size-2 text-amber-600 fill-amber-600" />
					) : (
						<Gift className="size-2 text-amber-600" />
					)}
					{info.schemeNote}
				</span>
			)}
			{info.vendorName && (
				<span className="text-muted-foreground opacity-80 hidden sm:inline">
					• {info.vendorName}
				</span>
			)}
		</div>
	);
}
