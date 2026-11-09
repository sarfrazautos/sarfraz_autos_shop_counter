"use client";

import { useRef } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Printer, X, Download, Share2 } from "lucide-react";
import type { OrderRecord } from "./types";

interface InvoiceSheetProps {
	order: OrderRecord | null;
	isOpen: boolean;
	onClose: () => void;
}

export function InvoiceSheet({ order, isOpen, onClose }: InvoiceSheetProps) {
	const printAreaRef = useRef<HTMLDivElement>(null);

	if (!order) return null;

	const handlePrint = () => {
		window.print();
	};

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			{/* Sheet opening from the RIGHT side as requested */}
			<SheetContent
				side="right"
				showCloseButton={false}
				className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-background overflow-hidden border-l"
			>
				{/* Top Actions Bar inside Sheet (Hidden during print) */}
				<div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30 print:hidden gap-3">
					<div className="flex items-center gap-1.5 min-w-0">
						<span className="font-heading font-semibold text-sm text-foreground truncate whitespace-nowrap">
							Invoice ({order.id})
						</span>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Button
							size="sm"
							onClick={handlePrint}
							className="h-8 px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs text-xs whitespace-nowrap"
						>
							<Printer className="size-3.5" />
							Print Invoice
						</Button>
						<Button
							size="icon-xs"
							variant="ghost"
							onClick={onClose}
							className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
						>
							<X className="size-4" />
							<span className="sr-only">Close</span>
						</Button>
					</div>
				</div>

				{/* Scrollable Receipt Body */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10 print:p-0 print:m-0 print:overflow-visible print:bg-white">
					{/* Printable Thermal/Challan Sheet Container matching reference image */}
					<div
						ref={printAreaRef}
						className="mx-auto max-w-[460px] bg-white text-black p-6 sm:p-7 rounded-lg shadow-sm border border-neutral-300 font-mono text-[13px] leading-snug print:w-full print:max-w-none print:m-0 print:p-2 print:border-none print:shadow-none"
					>
						{/* Company Header */}
						<div className="text-center space-y-1 pb-3">
							<h1 className="font-black text-lg sm:text-xl tracking-wider text-black">
								SARFRAZ AUTOS (SHAHMIR)
							</h1>
							<p className="text-[11px] font-semibold text-neutral-800">
								SHOP #23 TAJ MEHAL QASIM AUTO MKT I
							</p>
							<p className="text-[11px] font-semibold text-neutral-800">
								KARACHI, 03331285556, 03332624410
							</p>
							<p className="text-[11px] text-neutral-600">Page 1 of 1</p>
						</div>

						{/* Customer Info Section */}
						<div className="text-center py-2 border-t border-neutral-300">
							<p className="font-black text-sm uppercase underline tracking-wide">
								{order.customerName}
							</p>
							<p className="text-xs font-semibold uppercase text-neutral-700">
								{order.customerCity.toUpperCase()}
							</p>
						</div>

						{/* Invoice Meta Bar */}
						<div className="py-2.5 border-t-2 border-b-2 border-black space-y-1 text-xs">
							<div className="flex justify-between items-baseline font-bold">
								<span>Inv # {order.invoiceNumber}</span>
								<span>Dated {order.dateTimeFull}</span>
							</div>
							<div className="flex justify-between items-baseline text-[11px] text-neutral-800">
								<span className="truncate max-w-[200px]">Remarks: {order.remarks || "Counter Sale"}</span>
								<span>Godown: {order.godown}</span>
							</div>
							<div className="flex justify-between items-baseline text-[11px] font-semibold">
								<span>OWNER</span>
								<span>{order.paymentMethod}</span>
							</div>
						</div>

						{/* Items Table Headers matching reference: Total / ٹوٹل | Rate / ریٹ | Item / تفصیل آئٹم */}
						<div className="grid grid-cols-12 py-1.5 border-b-2 border-black font-bold text-xs">
							<div className="col-span-2 text-left">Total / ٹوٹل</div>
							<div className="col-span-3 text-center">Rate / ریٹ</div>
							<div className="col-span-7 text-right">Item / تفصیل آئٹم</div>
						</div>

						{/* Items Rows */}
						<div className="divide-y divide-neutral-200 py-1">
							{order.items.map((item, idx) => (
								<div key={idx} className="grid grid-cols-12 py-2 items-start text-xs">
									<div className="col-span-2 text-left font-bold font-mono">
										{item.total.toLocaleString()}
									</div>
									<div className="col-span-3 text-center text-neutral-800 font-mono">
										{item.rate.toLocaleString()} ({item.quantity})
									</div>
									<div className="col-span-7 text-right pl-2">
										<p className="font-bold text-neutral-900 leading-tight">{item.name}</p>
										{item.subLabel && (
											<p className="text-[10px] text-neutral-600 font-normal">{item.subLabel}</p>
										)}
									</div>
								</div>
							))}
						</div>

						{/* Bill Totals Summary */}
						<div className="border-t-2 border-black pt-2 space-y-1 text-xs">
							<div className="flex justify-between font-bold">
								<span>{order.totalAmount.toLocaleString()}</span>
								<span>Items: {order.items.length}&nbsp;&nbsp;&nbsp;&nbsp;Qty: {order.totalQuantity}</span>
							</div>

							{order.shippingCharges > 0 && (
								<div className="flex justify-between text-neutral-800">
									<span>+{order.shippingCharges}</span>
									<span>:Shipping Charges</span>
								</div>
							)}

							<div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-neutral-400">
								<span>Rs. {order.netBill.toLocaleString()}</span>
								<span>:Net Bill</span>
							</div>

							<div className="flex justify-between text-neutral-800">
								<span>Rs. {order.cashReceived.toLocaleString()}</span>
								<span>:Cash Received/Adj</span>
							</div>

							<div className="flex justify-between font-black text-sm pt-0.5">
								<span>Rs. {order.finalBalance.toLocaleString()}</span>
								<span>:Final Bal</span>
							</div>
						</div>

						{/* Urdu Note Footer from original reference invoice */}
						<div className="mt-6 pt-3 border-t-2 border-black text-center font-bold text-sm text-neutral-900 leading-relaxed font-sans" dir="rtl">
							اگر مال کی کمی ہو تو 3 دن میں اطلاع دیں،
							<br />
							اور تبدیلی کے لیے بل ضروری ہے۔
						</div>
					</div>
				</div>

				{/* Bottom Footer inside Sheet (Hidden during print) */}
				<SheetFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between print:hidden">
					<p className="text-[11px] text-muted-foreground">
						Press <strong>Ctrl + P</strong> or click <strong>Print Invoice</strong> to print via receipt / A4 printer.
					</p>
					<Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
						Close
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

