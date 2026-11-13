"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Store, Building2, MapPin } from "lucide-react";
import type { ProductItem } from "./types";

interface QuickStockDialogProps {
	product: ProductItem | null;
	isOpen: boolean;
	onClose: () => void;
	onAddStock: (productId: string, branchId: "main" | "branch-2" | "branch-3", addedQty: number) => void;
}

export function QuickStockDialog({ product, isOpen, onClose, onAddStock }: QuickStockDialogProps) {
	const [selectedBranch, setSelectedBranch] = useState<"main" | "branch-2" | "branch-3">("main");
	const [addQty, setAddQty] = useState<string>("10");

	if (!product) return null;

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		const qtyNum = parseInt(addQty, 10);
		if (isNaN(qtyNum) || qtyNum <= 0) return;

		onAddStock(product.id, selectedBranch, qtyNum);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Plus className="size-4" />
					</div>
					<DialogTitle className="text-base font-semibold">
						Restock Product Inventory
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Add new incoming stock for <span className="font-semibold text-foreground">{product.name}</span>.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSave} className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label className="text-xs font-medium">Select Branch Godown</Label>
						<div className="grid grid-cols-1 gap-2">
							{[
								{ id: "main" as const, name: "1st Branch (Saddar Workshop)", icon: Store },
								{ id: "branch-2" as const, name: "2nd Branch (Gulshan Auto Hub)", icon: Building2 },
								{ id: "branch-3" as const, name: "3rd Branch (DHA Express)", icon: MapPin },
							].map((br) => {
								const Icon = br.icon;
								const isSelected = selectedBranch === br.id;
								const curStock = product.branches.find((b) => b.branchId === br.id)?.stock ?? 0;

								return (
									<button
										key={br.id}
										type="button"
										onClick={() => setSelectedBranch(br.id)}
										className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
											isSelected
												? "border-primary bg-primary/[0.04] ring-1 ring-primary"
												: "border-border hover:bg-muted/50"
										}`}
									>
										<div className="flex items-center gap-2.5">
											<Icon className="size-4 text-muted-foreground" />
											<span className="text-xs font-medium text-foreground">{br.name}</span>
										</div>
										<span className="text-xs font-mono text-muted-foreground">Current: {curStock}</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="stock-qty" className="text-xs font-medium">
							Quantity to Add ({product.unit})
						</Label>
						<Input
							id="stock-qty"
							type="number"
							min={1}
							value={addQty}
							onChange={(e) => setAddQty(e.target.value)}
							className="h-9 font-mono"
							placeholder="e.g. 25"
							required
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
						<DialogClose render={<Button type="button" size="sm" variant="outline" className="cursor-pointer">Cancel</Button>} />
						<Button type="submit" size="sm" className="cursor-pointer">
							Add to Inventory
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

