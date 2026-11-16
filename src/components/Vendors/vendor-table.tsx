"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, MapPin, BookOpen, Edit2, User } from "lucide-react";
import type { VendorProfile } from "./types";

interface VendorTableProps {
	vendors: VendorProfile[];
	isLoading: boolean;
	onEdit: (vendor: VendorProfile) => void;
	onViewLedger: (vendor: VendorProfile) => void;
}

export function VendorTable({ vendors, isLoading, onEdit, onViewLedger }: VendorTableProps) {
	if (isLoading) {
		return (
			<div className="py-20 text-center text-xs text-muted-foreground space-y-2">
				<div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p>Loading suppliers directory...</p>
			</div>
		);
	}

	if (vendors.length === 0) {
		return (
			<div className="py-16 text-center text-muted-foreground space-y-2">
				<Building2 className="size-10 mx-auto opacity-30" />
				<p className="text-sm font-semibold text-foreground">No suppliers found</p>
				<p className="text-xs">Add your first supplier / factory to start recording purchases.</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-left text-xs">
				<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
					<tr>
						<th className="py-2.5 px-3">Vendor / Supplier</th>
						<th className="py-2.5 px-3">Contact Person</th>
						<th className="py-2.5 px-3">Phone & City</th>
						<th className="py-2.5 px-3 text-right">Payable Balance (Khata)</th>
						<th className="py-2.5 px-3 text-center">Status</th>
						<th className="py-2.5 px-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{vendors.map((vendor) => {
						const hasPayable = vendor.currentBalance > 0;
						return (
							<tr key={vendor.id} className="hover:bg-muted/30 transition-colors">
								{/* Vendor Name & Code */}
								<td className="py-3 px-3">
									<div className="flex items-center gap-2.5">
										<div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
											{vendor.name.charAt(0).toUpperCase()}
										</div>
										<div>
											<span className="font-semibold text-foreground text-xs block leading-tight">
												{vendor.name}
											</span>
											<span className="font-mono text-[10px] text-muted-foreground">
												{vendor.id}
											</span>
										</div>
									</div>
								</td>

								{/* Contact Person */}
								<td className="py-3 px-3 text-muted-foreground">
									<div className="flex items-center gap-1.5 text-xs text-foreground">
										<User className="size-3 text-muted-foreground" />
										<span>{vendor.contactPerson || "—"}</span>
									</div>
								</td>

								{/* Phone & City */}
								<td className="py-3 px-3">
									<div className="space-y-0.5">
										<div className="flex items-center gap-1 text-xs font-mono text-foreground">
											<Phone className="size-3 text-muted-foreground" />
											<span>{vendor.phone}</span>
										</div>
										<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
											<MapPin className="size-3" />
											<span>{vendor.city}</span>
										</div>
									</div>
								</td>

								{/* Balance */}
								<td className="py-3 px-3 text-right">
									<div className="flex flex-col items-end">
										<span
											className={`font-mono font-bold text-xs ${
												hasPayable
													? "text-rose-600 dark:text-rose-400"
													: "text-emerald-600 dark:text-emerald-400"
											}`}
										>
											Rs. {vendor.currentBalance.toLocaleString()}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{hasPayable ? "Payable Due" : "Settled / Nil"}
										</span>
									</div>
								</td>

								{/* Status */}
								<td className="py-3 px-3 text-center">
									<Badge
										variant={vendor.status === "Active" ? "secondary" : "outline"}
										className="text-[10px] py-0 px-2 font-medium"
									>
										{vendor.status}
									</Badge>
								</td>

								{/* Actions */}
								<td className="py-3 px-3 text-right">
									<div className="flex items-center justify-end gap-1.5">
										<Button
											type="button"
											variant="outline"
											size="xs"
											onClick={() => onViewLedger(vendor)}
											className="h-7 text-[11px] gap-1 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-semibold"
										>
											<BookOpen className="size-3" />
											Khata
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onClick={() => onEdit(vendor)}
											className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
											title="Edit Vendor"
										>
											<Edit2 className="size-3.5" />
										</Button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
