"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
	Sheet,
	SheetContent,
	SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
	Printer,
	X,
	MessageCircle,
	CheckCircle,
	Languages,
} from "lucide-react";
import type { OrderRecord } from "./types";

interface InvoiceSheetProps {
	order: OrderRecord | null;
	isOpen: boolean;
	onClose: () => void;
}

type InvoiceLanguage = "en" | "ur";

export function InvoiceSheet({ order, isOpen, onClose }: InvoiceSheetProps) {
	const printAreaRef = useRef<HTMLDivElement>(null);
	const [whatsappSent, setWhatsappSent] = useState(false);
	const [language, setLanguage] = useState<InvoiceLanguage>("ur"); // Default to Urdu for local market

	if (!order) return null;

	// Translation dictionaries
	const t = {
		en: {
			shopName: "SARFRAZ AUTOS",
			address: "SHOP #23 TAJ MEHAL QASIM AUTO MKT, SADDAR",
			cityPhone: "KARACHI | PH: 0333-1285556, 0333-2624410",
			pageText: "Page 1 of 1",
			customerLabel: "CUSTOMER / PARTY",
			invNo: "Inv #:",
			date: "Dated:",
			remarks: "Remarks:",
			godown: "Godown:",
			paymentMethod: "Payment:",
			tableTotal: "Total",
			tableRate: "Rate",
			tableQty: "Qty",
			tableItem: "Item Description",
			grossTotal: "Gross Total:",
			itemsCount: "Items",
			totalQty: "Qty",
			shippingCharges: "Shipping / Carriage:",
			netBill: "Net Bill:",
			cashReceived: "Cash Received / Adj:",
			finalBalance: "Remaining Khata Bal:",
			warrantyNotice: "Warranty: 7 Days Check Warranty Only.",
			termsNote1: "Please report shortage or defect within 3 days.",
			termsNote2: "Original invoice mandatory for return or exchange.",
			thankYou: "Thank you for choosing Sarfraz Autos!",
			ownerLabel: "OWNER COPY / CASH MEMO",
		},
		ur: {
			shopName: "سرفراز آٹوز",
			address: "دکان نمبر 23، تاج محل قاسم آٹو مارکیٹ، صدر",
			cityPhone: "کراچی | فون: 0333-1285556، 0333-2624410",
			pageText: "صفحہ 1 از 1",
			customerLabel: "گاہک / پارٹی کا نام",
			invNo: "بل نمبر:",
			date: "تاریخ:",
			remarks: "ریمارکس:",
			godown: "گودام:",
			paymentMethod: "ادائیگی:",
			tableTotal: "کل رقم",
			tableRate: "ریٹ",
			tableQty: "تعداد",
			tableItem: "تفصیل سامان / آئٹم",
			grossTotal: "مال کی رقم:",
			itemsCount: "آئٹمز",
			totalQty: "تعداد",
			shippingCharges: "کرایہ / بلٹی خرچ:",
			netBill: "کل صافی بل:",
			cashReceived: "نقد وصولی / جمع:",
			finalBalance: "بقایا واجب الادا کھاتہ:",
			warrantyNotice: "چیک وارنٹی: 7 دن (تبدیلی کی مدت)",
			termsNote1: "اگر مال میں کمی ہو تو 3 دن کے اندر اطلاع دیں،",
			termsNote2: "اور کسی بھی تبدیلی کے لیے اصل بل ہمراہ لانا لازمی ہے۔",
			thankYou: "سرفراز آٹوز پر تشریف لانے کا شکریہ!",
			ownerLabel: "سیلز رسید / کھاتہ میمو",
		},
	}[language];

	const translatePayment = (method: string) => {
		if (language === "en") return method;
		if (method.includes("Cash")) return "نقد کاؤنٹر";
		if (method.includes("Online")) return "آن لائن بینک";
		if (method.includes("Credit")) return "ادھار کھاتہ";
		return method;
	};

	const translateGodown = (godown: string) => {
		if (language === "en") return godown;
		if (godown.includes("SADDAR") || godown.includes("HEAD")) return "صدر مین ورکشاپ";
		if (godown.includes("GULSHAN")) return "گلشن اقبال";
		if (godown.includes("DHA")) return "ڈی ایچ اے کاؤنٹر";
		return godown;
	};

	// Dedicated Isolated Iframe Print for Thermal Receipt (Guarantees zero blank feed & exact 80mm cut)
	const handlePrint = () => {
		const isUrdu = language === "ur";

		const printContent = `
<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}" dir="${isUrdu ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.invoiceNumber} - Sarfraz Autos</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 76mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 2mm 2.5mm 3mm 2.5mm;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Arabic", Tahoma, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .font-mono { font-family: "Courier New", Courier, monospace; }
    .divider {
      border-top: 1px dashed #000;
      margin: 3px 0;
    }
    .solid-divider {
      border-top: 1.5px solid #000;
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 3px 0;
    }
    th {
      font-weight: bold;
      border-bottom: 1.5px solid #000;
      padding: 3px 1px;
      font-size: 10.5px;
    }
    td {
      padding: 2.5px 1px;
      vertical-align: top;
      font-size: 10.5px;
      border-bottom: 0.5px dashed #ccc;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 1.5px 0;
    }
    .header-logo {
      width: 38px;
      height: 38px;
      margin: 0 auto 3px auto;
      display: block;
      object-fit: contain;
    }
    .title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 9.5px;
      color: #111;
      font-weight: 600;
    }
    .customer-box {
      border-top: 1px solid #333;
      border-bottom: 1px solid #333;
      padding: 4px 2px;
      margin: 3px 0;
      text-align: center;
    }
    .customer-name {
      font-size: 13px;
      font-weight: 800;
    }
    .total-highlight {
      font-size: 13.5px;
      font-weight: 900;
    }
    .terms-box {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1.5px solid #000;
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="text-center">
    <img src="/logo.png" alt="Logo" class="header-logo" onerror="this.style.display='none'" />
    <div class="title">${t.shopName}</div>
    <div class="subtitle">${t.address}</div>
    <div class="subtitle">${t.cityPhone}</div>
    <div style="font-size: 9px; color: #555; margin-top: 1px;">${t.ownerLabel} • ${t.pageText}</div>
  </div>

  <!-- Customer Party -->
  <div class="customer-box">
    <div class="customer-name">${order.customerName}</div>
    <div style="font-size: 10px; font-weight: 600;">
      ${order.customerCity.toUpperCase()} ${order.customerPhone ? `• ${order.customerPhone}` : ""}
    </div>
  </div>

  <!-- Meta Info -->
  <div class="solid-divider"></div>
  <div class="row">
    <span><strong>${t.invNo}</strong> ${order.invoiceNumber}</span>
    <span class="font-mono text-sm"><strong>${t.date}</strong> ${order.dateTimeFull}</span>
  </div>
  <div class="row" style="font-size: 10px;">
    <span><strong>${t.godown}</strong> ${translateGodown(order.godown)}</span>
    <span><strong>${t.paymentMethod}</strong> ${translatePayment(order.paymentMethod)}</span>
  </div>
  ${order.remarks ? `<div class="row" style="font-size: 9.5px;"><span><strong>${t.remarks}</strong> ${order.remarks}</span></div>` : ""}
  <div class="solid-divider"></div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th class="${isUrdu ? "text-right" : "text-left"}" style="width: 50%;">${t.tableItem}</th>
        <th class="text-center" style="width: 14%;">${t.tableQty}</th>
        <th class="${isUrdu ? "text-left" : "text-right"}" style="width: 18%;">${t.tableRate}</th>
        <th class="${isUrdu ? "text-left" : "text-right"}" style="width: 18%;">${t.tableTotal}</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
				.map(
					(item) => `
        <tr>
          <td class="${isUrdu ? "text-right" : "text-left"}">
            <div class="bold">${item.name}</div>
            ${item.subLabel ? `<div style="font-size: 8.5px; color: #444;">${item.subLabel}</div>` : ""}
          </td>
          <td class="text-center font-mono bold">${item.quantity}</td>
          <td class="${isUrdu ? "text-left" : "text-right"} font-mono">${item.rate.toLocaleString()}</td>
          <td class="${isUrdu ? "text-left" : "text-right"} font-mono bold">${item.total.toLocaleString()}</td>
        </tr>
      `
				)
				.join("")}
    </tbody>
  </table>

  <!-- Bill Summary -->
  <div class="solid-divider"></div>
  <div class="row">
    <span>${t.grossTotal} (${t.itemsCount}: ${order.items.length} | ${t.totalQty}: ${order.totalQuantity})</span>
    <span class="font-mono bold">Rs. ${order.totalAmount.toLocaleString()}</span>
  </div>

  ${
		order.shippingCharges > 0
			? `
    <div class="row" style="font-size: 10px;">
      <span>${t.shippingCharges}</span>
      <span class="font-mono">+${order.shippingCharges.toLocaleString()}</span>
    </div>
  `
			: ""
	}

  <div class="divider"></div>
  <div class="row total-highlight">
    <span>${t.netBill}</span>
    <span class="font-mono">Rs. ${order.netBill.toLocaleString()}</span>
  </div>

  <div class="row" style="font-size: 10.5px;">
    <span>${t.cashReceived}</span>
    <span class="font-mono">Rs. ${order.cashReceived.toLocaleString()}</span>
  </div>

  <div class="row bold" style="font-size: 11.5px; margin-top: 2px;">
    <span>${t.finalBalance}</span>
    <span class="font-mono" style="text-decoration: underline;">Rs. ${order.finalBalance.toLocaleString()}</span>
  </div>

  <!-- Terms & Policy -->
  <div class="terms-box">
    <div>${t.warrantyNotice}</div>
    <div style="margin-top: 2px;">${t.termsNote1}</div>
    <div>${t.termsNote2}</div>
    <div style="margin-top: 3px; font-weight: normal; font-size: 9px; color: #444;">${t.thankYou}</div>
  </div>
</body>
</html>
		`;

		let printIframe = document.getElementById("thermal-print-iframe") as HTMLIFrameElement;
		if (!printIframe) {
			printIframe = document.createElement("iframe");
			printIframe.id = "thermal-print-iframe";
			printIframe.style.position = "fixed";
			printIframe.style.right = "0";
			printIframe.style.bottom = "0";
			printIframe.style.width = "0";
			printIframe.style.height = "0";
			printIframe.style.border = "none";
			document.body.appendChild(printIframe);
		}

		const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(printContent);
			iframeDoc.close();

			setTimeout(() => {
				printIframe.contentWindow?.focus();
				printIframe.contentWindow?.print();
			}, 250);
		} else {
			window.print();
		}
	};

	const handleWhatsAppShare = () => {
		let rawPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
		if (rawPhone.startsWith("0")) {
			rawPhone = "92" + rawPhone.slice(1);
		} else if (!rawPhone.startsWith("92") && rawPhone.length === 10) {
			rawPhone = "92" + rawPhone;
		}

		const isUrdu = language === "ur";
		const itemsSummary = order.items
			.map((it) => `• ${it.name} (${it.quantity}x @ Rs.${it.rate}) = Rs.${it.total}`)
			.join("\n");

		const message = isUrdu
			? `*سرفراز آٹوز — سیلز انوائس*\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*بل نمبر:* ${order.invoiceNumber}\n` +
				`*گاہک / پارٹی:* ${order.customerName} (${order.customerCity})\n` +
				`*تاریخ:* ${order.dateTimeFull}\n` +
				`*گودام:* ${translateGodown(order.godown)}\n\n` +
				`*تفصیل سامان:*\n${itemsSummary}\n\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*کل بل (صافی):* روپے ${order.netBill.toLocaleString()}\n` +
				`*نقد وصولی:* روپے ${order.cashReceived.toLocaleString()}\n` +
				`*بقایا کھاتہ:* روپے ${order.finalBalance.toLocaleString()}\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`چیک وارنٹی: 7 دن۔ کسی بھی تبدیلی کیلئے اصل بل ہمراہ لانا ضروری ہے۔\n` +
				`_سرفراز آٹوز پر تشریف لانے کا شکریہ!_`
			: `*SARFRAZ AUTOS — INVOICE*\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*Invoice #:* ${order.invoiceNumber}\n` +
				`*Customer:* ${order.customerName} (${order.customerCity})\n` +
				`*Date:* ${order.dateTimeFull}\n` +
				`*Godown:* ${order.godown}\n\n` +
				`*Items Purchased:*\n${itemsSummary}\n\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*Total Net Bill:* Rs. ${order.netBill.toLocaleString()}\n` +
				`*Cash Received:* Rs. ${order.cashReceived.toLocaleString()}\n` +
				`*Remaining Balance:* Rs. ${order.finalBalance.toLocaleString()}\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`7-Day Check Warranty Standard Applicable. Return/Exchange requires invoice.\n` +
				`_Thank you for choosing Sarfraz Autos!_`;

		const waUrl = rawPhone
			? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
			: `https://wa.me/?text=${encodeURIComponent(message)}`;

		window.open(waUrl, "_blank");
		setWhatsappSent(true);
		setTimeout(() => setWhatsappSent(false), 4000);
	};

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col bg-background overflow-hidden border-l"
			>
				{/* Top Actions & Language Bar (Clean, well-spaced, NO format clutter) */}
				<div className="flex flex-col gap-2.5 px-4 sm:px-5 py-3 border-b bg-muted/20 print:hidden">
					{/* Row 1: Title & Main Action Buttons */}
					<div className="flex items-center justify-between gap-2">
						<span className="font-heading font-bold text-sm text-foreground truncate">
							Invoice #{order.invoiceNumber}
						</span>

						<div className="flex items-center gap-1.5 shrink-0">
							<Button
								size="sm"
								variant="outline"
								onClick={handleWhatsAppShare}
								className="h-8 px-2.5 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 cursor-pointer shadow-2xs text-xs whitespace-nowrap"
							>
								{whatsappSent ? (
									<>
										<CheckCircle className="size-3.5 text-emerald-600" />
										Sent!
									</>
								) : (
									<>
										<MessageCircle className="size-3.5 text-emerald-600" />
										WhatsApp
									</>
								)}
							</Button>

							<Button
								size="sm"
								onClick={handlePrint}
								className="h-8 px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs text-xs font-semibold whitespace-nowrap"
							>
								<Printer className="size-3.5" />
								Print Thermal Slip
							</Button>

							<Button
								size="icon-xs"
								variant="ghost"
								onClick={onClose}
								className="size-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
							>
								<X className="size-4" />
								<span className="sr-only">Close</span>
							</Button>
						</div>
					</div>

					{/* Row 2: Print Language Switcher (Spacious and clearly aligned) */}
					<div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
						<span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
							<Languages className="size-3.5 text-primary" />
							Print Language:
						</span>

						<div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
							<button
								type="button"
								onClick={() => setLanguage("en")}
								className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
									language === "en"
										? "bg-background text-foreground shadow-2xs font-bold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								English
							</button>
							<button
								type="button"
								onClick={() => setLanguage("ur")}
								className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
									language === "ur"
										? "bg-background text-primary shadow-2xs font-bold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								🇵🇰 اردو (Urdu)
							</button>
						</div>
					</div>
				</div>

				{/* Scrollable Receipt Body */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-muted/15 flex justify-center print:p-0 print:m-0 print:bg-white">
					{/* 80mm Optimized Thermal Slip Container */}
					<div
						ref={printAreaRef}
						dir={language === "ur" ? "rtl" : "ltr"}
						className="w-full max-w-[340px] bg-white text-black p-3.5 sm:p-4 rounded-lg shadow-sm border border-neutral-300 font-sans text-xs leading-snug print:w-full print:max-w-none print:m-0 print:p-2 print:border-none print:shadow-none"
						style={{ height: "fit-content" }}
					>
						{/* Company Header */}
						<div className="text-center space-y-1 pb-2">
							<Image
								src="/logo.png"
								alt="Sarfraz Autos Logo"
								width={40}
								height={40}
								className="mx-auto mb-1 object-contain"
							/>
							<h1 className="font-black text-base sm:text-lg tracking-wide text-black">
								{t.shopName}
							</h1>
							<p className="text-[10px] font-semibold text-neutral-800 leading-tight">
								{t.address}
							</p>
							<p className="text-[10px] font-semibold text-neutral-700">
								{t.cityPhone}
							</p>
							<div className="flex items-center justify-between text-[9px] text-neutral-500 pt-0.5 border-t border-neutral-200">
								<span>{t.ownerLabel}</span>
								<span>{t.pageText}</span>
							</div>
						</div>

						{/* Customer Info Section */}
						<div className="text-center py-1.5 border-t border-b border-neutral-800 my-1 bg-neutral-50">
							<p className="font-black text-sm uppercase tracking-wide">
								{order.customerName}
							</p>
							<p className="text-[10px] font-semibold uppercase text-neutral-700">
								{order.customerCity.toUpperCase()} {order.customerPhone ? `• ${order.customerPhone}` : ""}
							</p>
						</div>

						{/* Invoice Meta Rows */}
						<div className="py-1.5 border-b-2 border-black space-y-1 text-[10.5px]">
							<div className="flex justify-between items-baseline">
								<span><strong>{t.invNo}</strong> <span className="font-mono">{order.invoiceNumber}</span></span>
								<span className="font-mono text-[10px]"><strong>{t.date}</strong> {order.dateTimeFull}</span>
							</div>
							<div className="flex justify-between items-baseline text-neutral-800">
								<span><strong>{t.godown}</strong> {translateGodown(order.godown)}</span>
								<span><strong>{t.paymentMethod}</strong> {translatePayment(order.paymentMethod)}</span>
							</div>
							{order.remarks && (
								<div className="text-[9.5px] text-neutral-600 truncate">
									<strong>{t.remarks}</strong> {order.remarks}
								</div>
							)}
						</div>

						{/* Items Table Headers: 50% Description, 14% Qty, 18% Rate, 18% Total */}
						<div className="grid grid-cols-12 py-1.5 border-b-2 border-black font-bold text-[10.5px] items-center">
							<div className={`col-span-6 ${language === "ur" ? "text-right" : "text-left"}`}>
								{t.tableItem}
							</div>
							<div className="col-span-2 text-center">
								{t.tableQty}
							</div>
							<div className={`col-span-2 ${language === "ur" ? "text-left" : "text-right"}`}>
								{t.tableRate}
							</div>
							<div className={`col-span-2 ${language === "ur" ? "text-left" : "text-right"}`}>
								{t.tableTotal}
							</div>
						</div>

						{/* Items Rows */}
						<div className="divide-y divide-dashed divide-neutral-300 py-0.5">
							{order.items.map((item, idx) => (
								<div key={idx} className="grid grid-cols-12 py-1.5 items-start text-[10.5px]">
									<div className={`col-span-6 ${language === "ur" ? "text-right" : "text-left"} pr-1`}>
										<p className="font-bold text-neutral-900 leading-tight">{item.name}</p>
										{item.subLabel && (
											<p className="text-[8.5px] text-neutral-600 font-normal">{item.subLabel}</p>
										)}
									</div>
									<div className="col-span-2 text-center font-bold font-mono">
										{item.quantity}
									</div>
									<div className={`col-span-2 ${language === "ur" ? "text-left" : "text-right"} font-mono text-neutral-800 text-[10px]`}>
										{item.rate.toLocaleString()}
									</div>
									<div className={`col-span-2 ${language === "ur" ? "text-left" : "text-right"} font-bold font-mono text-[10.5px]`}>
										{item.total.toLocaleString()}
									</div>
								</div>
							))}
						</div>

						{/* Bill Totals Summary (Fully aligned with no text collision) */}
						<div className="border-t-2 border-black pt-1.5 space-y-1 text-xs">
							<div className="flex justify-between items-baseline text-[10.5px]">
								<span className="text-neutral-700">
									{t.grossTotal} ({t.itemsCount}: {order.items.length} | {t.totalQty}: {order.totalQuantity})
								</span>
								<span className="font-mono font-bold">Rs. {order.totalAmount.toLocaleString()}</span>
							</div>

							{order.shippingCharges > 0 && (
								<div className="flex justify-between items-baseline text-neutral-800 text-[10.5px]">
									<span>{t.shippingCharges}</span>
									<span className="font-mono font-semibold">+{order.shippingCharges.toLocaleString()}</span>
								</div>
							)}

							<div className="flex justify-between items-baseline font-black text-sm pt-1 border-t border-dashed border-neutral-400">
								<span>{t.netBill}</span>
								<span className="font-mono text-base font-black">Rs. {order.netBill.toLocaleString()}</span>
							</div>

							<div className="flex justify-between items-baseline text-neutral-800 text-[10.5px]">
								<span>{t.cashReceived}</span>
								<span className="font-mono">Rs. {order.cashReceived.toLocaleString()}</span>
							</div>

							<div className="flex justify-between items-baseline font-black text-xs pt-0.5 border-t border-neutral-200">
								<span>{t.finalBalance}</span>
								<span className="font-mono underline text-sm">Rs. {order.finalBalance.toLocaleString()}</span>
							</div>
						</div>

						{/* Urdu Note & Policy Footer */}
						<div className="mt-3.5 pt-2 border-t-2 border-black text-center font-bold text-[11px] text-neutral-900 leading-relaxed">
							<p className="text-[10px] text-neutral-700">{t.warrantyNotice}</p>
							<p className="mt-0.5">{t.termsNote1}</p>
							<p>{t.termsNote2}</p>
							<p className="text-[9.5px] font-normal text-neutral-600 mt-1">{t.thankYou}</p>
						</div>
					</div>
				</div>

				{/* Bottom Footer inside Sheet */}
				<SheetFooter className="px-4 py-2.5 border-t bg-muted/20 flex flex-row items-center justify-between print:hidden">
					<span className="text-[11px] text-muted-foreground truncate">
						Thermal slip stops and auto-cuts at receipt footer.
					</span>
					<div className="flex items-center gap-2 shrink-0">
						<Button size="sm" onClick={handlePrint} className="cursor-pointer gap-1.5 h-8 text-xs font-semibold">
							<Printer className="size-3.5" />
							Print Slip
						</Button>
						<Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer h-8 text-xs">
							Close
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
