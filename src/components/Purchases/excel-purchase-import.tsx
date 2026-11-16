"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	FileSpreadsheet,
	UploadCloud,
	CheckCircle2,
	AlertCircle,
	Trash2,
	Plus,
	Zap,
	Gift,
	Loader2,
	Building2,
	Store,
	FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { ExcelImportRow } from "./types";
import type { VendorProfile } from "@/components/Vendors/types";
import { BRANCHES, type BranchId } from "@/components/Counter/types";

interface ExcelPurchaseImportProps {
	vendors: VendorProfile[];
	onSuccess: () => void;
}

export function ExcelPurchaseImport({ vendors, onSuccess }: ExcelPurchaseImportProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [rows, setRows] = useState<ExcelImportRow[]>([]);
	const [isParsing, setIsParsing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);

	// Purchase metadata
	const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || "");
	const [invoiceNumber, setInvoiceNumber] = useState<string>("");
	const [targetBranchId, setTargetBranchId] = useState<BranchId>("main");
	const [paidAmount, setPaidAmount] = useState<number>(0);
	const [remarks, setRemarks] = useState<string>("");

	// Parse Excel File
	const handleFile = async (file: File) => {
		if (!file) return;
		setIsParsing(true);
		setErrorMessage(null);
		setSuccessNotice(null);
		setFileName(file.name);

		try {
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data, { type: "array" });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

			if (jsonData.length === 0) {
				setErrorMessage("Excel sheet is empty. Please upload a file containing items.");
				setIsParsing(false);
				return;
			}

			// Map columns flexibly
			const parsedRows: ExcelImportRow[] = jsonData.map((row, idx) => {
				// Search for column keys case-insensitively
				const findVal = (keys: string[]) => {
					for (const k of Object.keys(row)) {
						const lowerK = k.toLowerCase().trim();
						if (keys.some((target) => lowerK.includes(target))) {
							return row[k];
						}
					}
					return "";
				};

				const name =
					findVal(["product", "name", "item", "description", "part"]) || `Item #${idx + 1}`;
				const sku = findVal(["sku", "code", "part no", "number"]) || `SKU-${idx + 101}`;
				const bikeModel = findVal(["model", "bike", "vehicle"]) || "Honda CD70";
				const rawRate = findVal(["rate", "price", "cost", "unit price"]);
				const rate = parseFloat(rawRate) || 100;
				const rawQty = findVal(["qty", "quantity", "units", "count"]);
				const qty = parseInt(rawQty, 10) || 10;
				const rawFree = findVal(["free", "bonus", "scheme"]);
				const freeQty = parseInt(rawFree, 10) || 0;

				return {
					id: `row-${idx}-${Date.now()}`,
					productName: String(name).trim(),
					sku: String(sku).trim(),
					bikeModel: String(bikeModel).trim(),
					purchaseRate: rate,
					quantity: Math.max(1, qty),
					freeQuantity: Math.max(0, freeQty),
					isNetScheme: false,
					schemeNote: freeQty > 0 ? `+${freeQty} Free` : undefined,
					lineTotal: rate * Math.max(1, qty),
				};
			});

			setRows(parsedRows);
		} catch (err: any) {
			console.error("Error reading Excel file:", err);
			setErrorMessage("Failed to read Excel file. Please ensure it is a valid .xlsx or .csv file.");
		} finally {
			setIsParsing(false);
		}
	};

	const handleRowChange = (id: string, field: keyof ExcelImportRow, value: any) => {
		setRows((prev) =>
			prev.map((r) => {
				if (r.id === id) {
					const updated = { ...r, [field]: value };
					if (field === "purchaseRate" || field === "quantity") {
						updated.lineTotal = updated.purchaseRate * updated.quantity;
					}
					return updated;
				}
				return r;
			})
		);
	};

	const toggleNetScheme = (id: string) => {
		setRows((prev) =>
			prev.map((r) => {
				if (r.id === id) {
					const nextNet = !r.isNetScheme;
					// Formula Rate * 10 / 11 if turning on
					const buyQty = r.quantity || 10;
					const freeQty = r.freeQuantity || 1;
					let newRate = r.purchaseRate;
					if (nextNet) {
						newRate = Math.round((r.purchaseRate * buyQty) / (buyQty + freeQty));
					}
					return {
						...r,
						isNetScheme: nextNet,
						purchaseRate: newRate,
						freeQuantity: nextNet ? 0 : freeQty,
						lineTotal: newRate * r.quantity,
						schemeNote: nextNet ? "Net Scheme Rate" : freeQty > 0 ? `+${freeQty} Free` : undefined,
					};
				}
				return r;
			})
		);
	};

	const removeRow = (id: string) => {
		setRows((prev) => prev.filter((r) => r.id !== id));
	};

	// Totals
	const totalBilledQty = rows.reduce((sum, r) => sum + r.quantity, 0);
	const totalFreeQty = rows.reduce((sum, r) => sum + r.freeQuantity, 0);
	const totalDeliveredQty = totalBilledQty + totalFreeQty;
	const totalBillAmount = rows.reduce((sum, r) => sum + r.lineTotal, 0);

	// Submit Import to Database
	const handleImportToDatabase = async () => {
		if (rows.length === 0) {
			setErrorMessage("No items to import. Please upload an Excel file first.");
			return;
		}
		if (!selectedVendorId) {
			setErrorMessage("Please select a vendor / supplier.");
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);
		const vendor = vendors.find((v) => v.id === selectedVendorId);

		try {
			const res = await fetch("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					vendorId: selectedVendorId,
					vendorName: vendor?.name || "Vendor Supplier",
					invoiceNumber: invoiceNumber || `BILL-${Date.now().toString().slice(-5)}`,
					branchId: targetBranchId,
					paidAmount: paidAmount || 0,
					remarks: remarks || `Imported via Excel: ${fileName || "vendor-bill.xlsx"}`,
					items: rows.map((r) => ({
						productName: r.productName,
						sku: r.sku,
						bikeModel: r.bikeModel,
						purchaseRate: r.purchaseRate,
						quantity: r.quantity,
						freeQuantity: r.freeQuantity,
						isNetScheme: r.isNetScheme,
						schemeNote: r.schemeNote,
					})),
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to import purchase into inventory");
			}

			setSuccessNotice(
				`Successfully imported ${rows.length} spare parts (${totalDeliveredQty} pieces) into ${targetBranchId} inventory! Bill recorded under ${vendor?.name}.`
			);
			setRows([]);
			setFileName(null);
			onSuccess();
		} catch (err: any) {
			setErrorMessage(err.message || "Failed to import Excel purchase bill");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-5">
			{/* Dropzone Card */}
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragging(false);
					if (e.dataTransfer.files && e.dataTransfer.files[0]) {
						handleFile(e.dataTransfer.files[0]);
					}
				}}
				onClick={() => fileInputRef.current?.click()}
				className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
					isDragging
						? "border-primary bg-primary/10 scale-[1.01]"
						: "border-muted-foreground/30 hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
				}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept=".xlsx,.xls,.csv"
					className="hidden"
					onChange={(e) => {
						if (e.target.files && e.target.files[0]) {
							handleFile(e.target.files[0]);
						}
					}}
				/>

				<div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
					<div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-xs">
						<FileSpreadsheet className="size-7" />
					</div>
					<h3 className="font-heading font-bold text-sm text-foreground">
						{fileName ? fileName : "Upload Vendor Excel / CSV Bill"}
					</h3>
					<p className="text-xs text-muted-foreground">
						Drag & drop your factory purchase spreadsheet, or{" "}
						<span className="text-primary font-semibold underline">browse file</span> (.xlsx, .xls,
						.csv)
					</p>
					<span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border mt-1">
						Auto-detects: Item Name, SKU, Rate, Qty & Free Schemes
					</span>
				</div>
			</div>

			{/* Parsing Indicator */}
			{isParsing && (
				<div className="p-4 rounded-xl border bg-card flex items-center justify-center gap-2 text-xs text-primary font-semibold">
					<Loader2 className="size-4 animate-spin" />
					<span>Parsing Excel rows and detecting columns...</span>
				</div>
			)}

			{/* Error Alert */}
			{errorMessage && (
				<div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
					<AlertCircle className="size-4 shrink-0 text-rose-600" />
					<span>{errorMessage}</span>
				</div>
			)}

			{/* Success Notice */}
			{successNotice && (
				<div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
					<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
					<span>{successNotice}</span>
				</div>
			)}

			{/* Parsed Excel Items Table & Header Form */}
			{rows.length > 0 && (
				<div className="rounded-2xl border bg-card shadow-xs overflow-hidden space-y-4 p-5 animate-in fade-in">
					{/* Header Purchase Settings */}
					<div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pb-4 border-b">
						{/* Vendor Selector */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Building2 className="size-3 text-muted-foreground" />
								Supplier / Vendor *
							</label>
							<select
								value={selectedVendorId}
								onChange={(e) => setSelectedVendorId(e.target.value)}
								className="w-full h-9 px-2 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
							>
								{vendors.map((v) => (
									<option key={v.id} value={v.id}>
										{v.name} ({v.city})
									</option>
								))}
							</select>
						</div>

						{/* Bill Number */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<FileText className="size-3 text-muted-foreground" />
								Vendor Bill / Invoice #
							</label>
							<Input
								placeholder="e.g. CRW-8941"
								value={invoiceNumber}
								onChange={(e) => setInvoiceNumber(e.target.value)}
								className="h-9 text-xs font-mono"
							/>
						</div>

						{/* Target Branch */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Store className="size-3 text-muted-foreground" />
								Receiving Branch *
							</label>
							<select
								value={targetBranchId}
								onChange={(e) => setTargetBranchId(e.target.value as BranchId)}
								className="w-full h-9 px-2 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
							>
								{BRANCHES.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
						</div>

						{/* Paid Amount */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground">
								Cash Paid to Vendor (PKR)
							</label>
							<Input
								type="number"
								placeholder="0 (Unpaid on Credit)"
								value={paidAmount || ""}
								onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
								className="h-9 text-xs font-mono font-bold"
							/>
						</div>
					</div>

					{/* Live Parsed Preview Table */}
					<div>
						<div className="flex items-center justify-between pb-2">
							<h4 className="text-xs font-bold text-foreground">
								Parsed Excel Items ({rows.length} lines)
							</h4>
							<span className="text-[11px] text-muted-foreground">
								Review or adjust values before applying to inventory
							</span>
						</div>

						<div className="overflow-x-auto rounded-xl border">
							<table className="w-full text-xs text-left">
								<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
									<tr>
										<th className="py-2 px-3 w-8">#</th>
										<th className="py-2 px-3 min-w-[200px]">Product Name & Model</th>
										<th className="py-2 px-3 w-28">SKU</th>
										<th className="py-2 px-3 w-24 text-right">Cost Rate</th>
										<th className="py-2 px-3 w-20 text-center">Billed Qty</th>
										<th className="py-2 px-3 w-20 text-center">Free Bonus</th>
										<th className="py-2 px-3 w-24 text-center">Net Scheme</th>
										<th className="py-2 px-3 w-28 text-right">Total (PKR)</th>
										<th className="py-2 px-2 w-8 text-center"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{rows.map((row, index) => (
										<tr key={row.id} className="hover:bg-muted/20">
											<td className="py-2 px-3 font-mono text-muted-foreground text-center">
												{index + 1}
											</td>
											<td className="py-2 px-3">
												<Input
													value={row.productName}
													onChange={(e) =>
														handleRowChange(row.id, "productName", e.target.value)
													}
													className="h-7 text-xs font-medium"
												/>
											</td>
											<td className="py-2 px-3">
												<Input
													value={row.sku}
													onChange={(e) => handleRowChange(row.id, "sku", e.target.value)}
													className="h-7 text-xs font-mono"
												/>
											</td>
											<td className="py-2 px-3 text-right">
												<Input
													type="number"
													value={row.purchaseRate}
													onChange={(e) =>
														handleRowChange(
															row.id,
															"purchaseRate",
															parseFloat(e.target.value) || 0
														)
													}
													className="h-7 text-xs font-mono font-bold text-right"
												/>
											</td>
											<td className="py-2 px-3 text-center">
												<Input
													type="number"
													value={row.quantity}
													onChange={(e) =>
														handleRowChange(
															row.id,
															"quantity",
															parseInt(e.target.value, 10) || 1
														)
													}
													className="h-7 text-xs font-mono text-center"
												/>
											</td>
											<td className="py-2 px-3 text-center">
												<Input
													type="number"
													value={row.freeQuantity}
													onChange={(e) =>
														handleRowChange(
															row.id,
															"freeQuantity",
															parseInt(e.target.value, 10) || 0
														)
													}
													disabled={row.isNetScheme}
													className="h-7 text-xs font-mono text-center disabled:opacity-50"
												/>
											</td>
											<td className="py-2 px-3 text-center">
												<button
													type="button"
													onClick={() => toggleNetScheme(row.id)}
													className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto ${
														row.isNetScheme
															? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
															: "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
													}`}
												>
													<Zap
														className={`size-2.5 ${
															row.isNetScheme ? "fill-amber-500 text-amber-500" : ""
														}`}
													/>
													{row.isNetScheme ? "Net Rate" : "Normal"}
												</button>
											</td>
											<td className="py-2 px-3 text-right font-mono font-bold text-foreground">
												Rs. {row.lineTotal.toLocaleString()}
											</td>
											<td className="py-2 px-2 text-center">
												<button
													type="button"
													onClick={() => removeRow(row.id)}
													className="text-muted-foreground hover:text-rose-600 cursor-pointer p-1"
													title="Remove item"
												>
													<Trash2 className="size-3.5" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Summary Calculation & Big Apply Button */}
					<div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-4 text-xs flex-wrap">
							<div>
								<span className="text-muted-foreground block text-[11px]">Billed Quantity:</span>
								<strong className="font-mono text-foreground text-sm">
									{totalBilledQty} units
								</strong>
							</div>
							<div>
								<span className="text-muted-foreground block text-[11px]">Free Bonus Delivered:</span>
								<strong className="font-mono text-emerald-600 text-sm">
									+{totalFreeQty} Free
								</strong>
							</div>
							<div>
								<span className="text-muted-foreground block text-[11px]">
									Total Stock Inward:
								</span>
								<strong className="font-mono text-foreground text-sm">
									{totalDeliveredQty} pieces
								</strong>
							</div>
							<div className="border-l pl-4">
								<span className="text-muted-foreground block text-[11px]">Total Bill Value:</span>
								<strong className="font-mono font-black text-rose-600 dark:text-rose-400 text-base">
									Rs. {totalBillAmount.toLocaleString()}
								</strong>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setRows([]);
									setFileName(null);
								}}
								className="text-xs cursor-pointer text-muted-foreground hover:text-rose-600"
							>
								Clear Table
							</Button>
							<Button
								type="button"
								size="sm"
								disabled={isSubmitting || rows.length === 0}
								onClick={handleImportToDatabase}
								className="text-xs font-bold gap-2 cursor-pointer bg-primary text-primary-foreground shadow-sm h-9 px-4"
							>
								{isSubmitting ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<CheckCircle2 className="size-4" />
								)}
								Apply & Import into Inventory
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
