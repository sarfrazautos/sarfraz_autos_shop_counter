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
import type { OrderRecord, OrderItem } from "./types";

interface InvoiceSheetProps {
	order: OrderRecord | null;
	isOpen: boolean;
	onClose: () => void;
}

type InvoiceLanguage = "en" | "ur";

export interface FormattedBillRow {
	qty: number;
	name: string;
	subLabel?: string;
	rateDisplay: string;
	totalDisplay: string;
	isFree: boolean;
}

export function expandBillRows(items: OrderItem[]): {
	rows: FormattedBillRow[];
	totalDeliveredPieces: number;
	totalFreePieces: number;
} {
	const rows: FormattedBillRow[] = [];
	let totalDeliveredPieces = 0;
	let totalFreePieces = 0;

	for (const it of items) {
		let freeUnits = it.freeQuantity || 0;
		if (!freeUnits && it.subLabel) {
			const m = it.subLabel.match(/(?:\+|🎁\s*\+)(\d+)\s*Free/i);
			if (m) freeUnits = parseInt(m[1], 10);
		}

		totalDeliveredPieces += it.quantity + freeUnits;
		totalFreePieces += freeUnits;

		// Clean sublabel of free bonus tags to avoid repetitive text
		const cleanSubLabel = it.subLabel
			? it.subLabel.replace(/\[🎁\s*\+\d+\s*Free[^\]]*\]/gi, "").trim()
			: "";

		// Rate display: show original company list rate + (discounted net rate) if scheme applied
		let rateStr = it.rate.toLocaleString();
		if (
			it.originalRate &&
			it.discountedRate &&
			it.originalRate !== it.discountedRate
		) {
			rateStr = `${it.originalRate.toLocaleString()} (${it.discountedRate.toLocaleString()})`;
		}

		// 1. Purchased item line
		rows.push({
			qty: it.quantity,
			name: it.name,
			subLabel: cleanSubLabel,
			rateDisplay: rateStr,
			totalDisplay: it.total.toLocaleString(),
			isFree: false,
		});

		// 2. Dedicated FREE bonus item line directly below (as requested by client)
		if (freeUnits > 0) {
			rows.push({
				qty: freeUnits,
				name: it.name,
				subLabel: "",
				rateDisplay: "FREE",
				totalDisplay: "FREE",
				isFree: true,
			});
		}
	}

	return { rows, totalDeliveredPieces, totalFreePieces };
}

export function InvoiceSheet({ order, isOpen, onClose }: InvoiceSheetProps) {
	const printAreaRef = useRef<HTMLDivElement>(null);
	const [whatsappSent, setWhatsappSent] = useState(false);
	const [language, setLanguage] = useState<InvoiceLanguage>("ur"); // Default to Urdu for local market

	if (!order) return null;

	const { rows: billRows, totalDeliveredPieces } = expandBillRows(order.items);
	const discountAmount =
		order.discountAmount ??
		Math.max(
			0,
			order.totalAmount + (order.shippingCharges || 0) - order.netBill
		);
	const openingBal = order.openingBalance ?? 0;

	// Translation dictionaries
	const t = {
		en: {
			shopName: "SARFRAZ AUTOS (SHAHMIR)",
			address: "SHOP #23 TAJ MEHAL QASIM AUTO MKT, SADDAR",
			cityPhone: "KARACHI, 03331285556, 03332624410",
			pageText: "Page 1 of 1",
			customerLabel: "CUSTOMER / PARTY",
			invNo: "Inv #",
			date: "Dated",
			remarks: "Remarks:",
			godown: "Godown:",
			paymentMethod: "Payment:",
			tableTotal: "Total",
			tableRate: "Rate",
			tableItem: "Item Description",
			tableQty: "Qty",
			grossTotal: "Gross Total",
			itemsCount: "Items",
			totalQty: "Qty",
			discLabel: ":Disc",
			netLabel: ":Net Bill",
			cashLabel: ":Cash Received/Adj",
			openingLabel: ":Opening Bal",
			finalLabel: ":Final Bal",
			warrantyNotice: "Warranty: 7 Days Check Warranty Only.",
			termsNote1: "Please report shortage or defect within 3 days,",
			termsNote2: "and original invoice is mandatory for return or exchange.",
			thankYou: "Thank you for choosing Sarfraz Autos!",
			ownerLabel: "OWNER",
		},
		ur: {
			shopName: "سرفراز آٹوز (شہمیر)",
			address: "دکان نمبر 23، تاج محل قاسم آٹو مارکیٹ، صدر",
			cityPhone: "کراچی، 03331285556، 03332624410",
			pageText: "صفحہ 1 از 1",
			customerLabel: "گاہک / پارٹی کا نام",
			invNo: "بل نمبر",
			date: "تاریخ",
			remarks: "ریمارکس:",
			godown: "گودام:",
			paymentMethod: "ادائیگی:",
			tableTotal: "ٹوٹل",
			tableRate: "ریٹ",
			tableItem: "تفصیل آئٹم",
			tableQty: "تعداد",
			grossTotal: "مال کی رقم",
			itemsCount: "آئٹمز",
			totalQty: "تعداد",
			discLabel: ":ڈسکاؤنٹ",
			netLabel: ":صافی بل",
			cashLabel: ":نقد وصولی / جمع",
			openingLabel: ":سابقہ بقایا کھاتہ",
			finalLabel: ":کل بقایا واجب الادا",
			warrantyNotice: "چیک وارنٹی: 7 دن (تبدیلی کی مدت)",
			termsNote1: "اگر مال کی کمی ہو تو 3 دن میں اطلاع دیں،",
			termsNote2: "اور تبدیلی کے لیے اصل بل ضروری ہے۔",
			thankYou: "سرفراز آٹوز پر تشریف لانے کا شکریہ!",
			ownerLabel: "OWNER",
		},
	}[language];

	const translatePayment = (method: string) => {
		if (language === "en") {
			return method === "Credit / Khata" || method.includes("Credit")
				? "On Credit"
				: method;
		}
		if (method.includes("Cash")) return "نقد کاؤنٹر";
		if (method.includes("Online")) return "آن لائن بینک";
		if (method.includes("Credit")) return "On Credit";
		return method;
	};

	const translateGodown = (godown: string) => {
		if (language === "en") return godown;
		if (godown.includes("SADDAR") || godown.includes("HEAD") || godown.includes("1ST"))
			return "HEAD OFFICE";
		if (godown.includes("GULSHAN") || godown.includes("2ND")) return "GULSHAN AUTO HUB";
		if (godown.includes("DHA") || godown.includes("3RD")) return "DHA EXPRESS COUNTER";
		return godown;
	};

	// Dedicated Isolated Iframe Print for Thermal Receipt (Guarantees exact 80mm cut & solid box borders)
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
      width: 72mm;
      max-width: 74mm;
      margin: 0 auto;
      padding: 1.5mm 2mm 3mm 2mm;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Arabic", Tahoma, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .font-mono { font-family: "Courier New", Courier, monospace; }

    /* Boxed Grid Table exactly matching client legacy receipt */
    table.receipt-grid {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      margin-top: 4px;
    }
    table.receipt-grid th {
      border: 1px solid #000;
      padding: 4px 2px;
      font-size: 11.5px;
      font-weight: 900;
      text-align: center;
      background: #f0f0f0;
      color: #000;
    }
    table.receipt-grid td {
      border: 1px solid #000;
      padding: 4px 2.5px;
      font-size: 12.5px;
      vertical-align: middle;
      color: #000;
    }

    /* Summary Grid directly attached to bottom of table */
    table.summary-grid {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      border-top: none;
      font-size: 12px;
    }
    table.summary-grid td {
      border: 1px solid #000;
      padding: 3px 3px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 1.5px 0;
    }
    .header-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000;
    }
    .header-sub {
      font-size: 10.5px;
      font-weight: 800;
      color: #000;
      line-height: 1.25;
    }
    .customer-line {
      text-align: center;
      font-size: 15px;
      font-weight: 900;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 4px 0 3px 0;
      color: #000;
    }
    .meta-box {
      font-size: 11px;
      line-height: 1.35;
      font-weight: 700;
      border-top: 1px solid #000;
      padding-top: 2px;
      color: #000;
    }
    .terms-box {
      margin-top: 6px;
      padding-top: 4px;
      text-align: center;
      font-size: 10.5px;
      font-weight: bold;
      line-height: 1.35;
      border-top: 1px solid #000;
      color: #000;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="text-center">
    <div class="header-title">${t.shopName}</div>
    <div class="header-sub">${t.address}</div>
    <div class="header-sub">${t.cityPhone}</div>
    <div style="font-size: 9px; font-weight: bold; text-align: right; margin-top: 1px; color: #111;">${t.pageText}</div>
  </div>

  <!-- Customer Party Name (Centered & Underlined) -->
  <div class="customer-line">
    ${order.customerName}
  </div>

  <!-- Meta Info -->
  <div class="meta-box">
    <div class="row">
      <span><strong>${t.invNo}</strong> ${order.invoiceNumber}</span>
      <span><strong>${t.date}</strong> ${order.date}</span>
    </div>
    ${order.remarks ? `<div class="row" style="font-size: 9.5px; font-weight: 600;"><span><strong>${t.remarks}</strong> ${order.remarks}</span></div>` : ""}
    <div class="row">
      <span><strong>${t.godown}</strong> <u>${translateGodown(order.godown)}</u></span>
    </div>
    <div class="row" style="border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-top: 1px;">
      <span style="font-size: 10px; font-weight: bold;">${order.dateTimeFull} ${t.ownerLabel}</span>
      <span style="font-size: 10.5px; font-weight: 900;">${translatePayment(order.paymentMethod)}${order.paymentProofUrl ? (isUrdu ? " (سلپ)" : " (Slip)") : ""}</span>
    </div>
  </div>

  <!-- Boxed Items Table (Matching old legacy receipt) -->
  <table class="receipt-grid">
    <thead>
      <tr>
        <th style="width: 22%; text-align: right;">${t.tableTotal}</th>
        <th style="width: 18%; text-align: center;">${t.tableRate}</th>
        <th style="width: 48%; text-align: ${isUrdu ? "right" : "left"};">${t.tableItem}</th>
        <th style="width: 12%; text-align: center;">${t.tableQty}</th>
      </tr>
    </thead>
    <tbody>
      ${billRows
				.map(
					(row) => `
        <tr style="${row.isFree ? "background-color: #fafafa; font-weight: bold;" : ""}">
          <td style="text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: 900; font-size: 13px;">
            ${row.totalDisplay}
          </td>
          <td style="text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 11.5px; font-weight: 800;">
            ${row.rateDisplay}
          </td>
          <td style="text-align: ${isUrdu ? "right" : "left"};">
            <div style="font-weight: 900; font-size: 13px; line-height: 1.2; color: #000;">${row.name}</div>
            ${row.subLabel ? `<div style="font-size: 10px; font-weight: 700; color: #222; margin-top: 1.5px;">${row.subLabel}</div>` : ""}
          </td>
          <td style="text-align: center; font-family: 'Courier New', Courier, monospace; font-weight: 900; font-size: 14px;">
            ${row.qty}
          </td>
        </tr>
      `
				)
				.join("")}
    </tbody>
  </table>

  <!-- Boxed Bottom Summary (Exact Match to Old Receipt) -->
  <table class="summary-grid">
    <tr>
      <td style="width: 22%; text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 13px;">
        ${order.totalAmount.toLocaleString()}
      </td>
      <td style="text-align: center; font-weight: 900; font-size: 12px;">
        ${t.itemsCount}: ${order.items.length}
      </td>
      <td style="width: 12%; text-align: center; font-family: 'Courier New', monospace; font-weight: 900; font-size: 14px;">
        ${totalDeliveredPieces}
      </td>
    </tr>

    ${
			discountAmount > 0
				? `
    <tr>
      <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 12.5px;">
        -${discountAmount.toLocaleString()}
      </td>
      <td colspan="2" style="text-align: ${isUrdu ? "right" : "left"}; font-size: 11px; font-weight: 800;">
        <strong>${t.discLabel}</strong> Trade Scheme Discount Relief
      </td>
    </tr>
    `
				: ""
		}

    <tr>
      <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 14px;">
        ${order.netBill.toLocaleString()}
      </td>
      <td colspan="2" style="text-align: ${isUrdu ? "right" : "left"}; font-weight: 900; font-size: 13.5px;">
        <strong>${t.netLabel}</strong>
      </td>
    </tr>

    <tr>
      <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 13px;">
        ${order.cashReceived.toLocaleString()}
      </td>
      <td colspan="2" style="text-align: ${isUrdu ? "right" : "left"}; font-size: 12px; font-weight: 800;">
        <strong>${t.cashLabel}</strong>
      </td>
    </tr>

    ${
			openingBal !== 0
				? `
    <tr>
      <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 13px;">
        ${openingBal.toLocaleString()}
      </td>
      <td colspan="2" style="text-align: ${isUrdu ? "right" : "left"}; font-size: 12px; font-weight: 800;">
        <strong>${t.openingLabel}</strong>
      </td>
    </tr>
    `
				: ""
		}

    <tr style="background: #f2f2f2;">
      <td style="border: 2px solid #000; text-align: right; font-family: 'Courier New', monospace; font-weight: 900; font-size: 15px;">
        ${order.finalBalance.toLocaleString()}
      </td>
      <td colspan="2" style="border: 2px solid #000; text-align: ${isUrdu ? "right" : "left"}; font-weight: 900; font-size: 14px;">
        <strong>${t.finalLabel}</strong>
      </td>
    </tr>
  </table>

  <!-- Urdu Policy Footer -->
  <div class="terms-box">
    <div>${t.termsNote1} ${t.termsNote2}</div>
    <div style="margin-top: 2px; font-weight: normal; font-size: 9px; color: #444;">
      ${t.warrantyNotice} • ${t.thankYou}
    </div>
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
		const itemsSummary = billRows
			.map((r) =>
				r.isFree
					? `  🎁 *[FREE BONUS]*: +${r.qty}x ${r.name} = FREE`
					: `• *${r.name}* (${r.qty}x @ Rs.${r.rateDisplay}) = Rs.${r.totalDisplay}`
			)
			.join("\n");

		const message = isUrdu
			? `*سرفراز آٹوز — سیلز انوائس*\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*بل نمبر:* ${order.invoiceNumber}\n` +
				`*گاہک / پارٹی:* ${order.customerName} (${order.customerCity})\n` +
				`*تاریخ:* ${order.date}\n` +
				`*گودام:* ${translateGodown(order.godown)}\n` +
				`*ادائیگی:* ${translatePayment(order.paymentMethod)}\n\n` +
				`*تفصیل بل و سامان (کل تعداد: ${totalDeliveredPieces}):*\n${itemsSummary}\n\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*مال کی رقم:* روپے ${order.totalAmount.toLocaleString()}\n` +
				(discountAmount > 0 ? `*ڈسکاؤنٹ رعایت:* -روپے ${discountAmount.toLocaleString()}\n` : "") +
				`*کل صافی بل:* روپے ${order.netBill.toLocaleString()}\n` +
				`*نقد وصولی:* روپے ${order.cashReceived.toLocaleString()}\n` +
				(openingBal !== 0 ? `*سابقہ بقایا:* روپے ${openingBal.toLocaleString()}\n` : "") +
				`*کل بقایا واجب الادا:* روپے ${order.finalBalance.toLocaleString()}\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`اگر مال کی کمی ہو تو 3 دن میں اطلاع دیں، اور تبدیلی کے لیے اصل بل ضروری ہے۔\n` +
				`_سرفراز آٹوز پر تشریف لانے کا شکریہ!_`
			: `*SARFRAZ AUTOS — INVOICE*\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*Invoice #:* ${order.invoiceNumber}\n` +
				`*Customer:* ${order.customerName} (${order.customerCity})\n` +
				`*Date:* ${order.date}\n` +
				`*Godown:* ${translateGodown(order.godown)}\n` +
				`*Payment:* ${translatePayment(order.paymentMethod)}\n\n` +
				`*Items (Total Qty: ${totalDeliveredPieces}):*\n${itemsSummary}\n\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`*Gross Total:* Rs. ${order.totalAmount.toLocaleString()}\n` +
				(discountAmount > 0 ? `*Discount Relief:* -Rs. ${discountAmount.toLocaleString()}\n` : "") +
				`*Net Bill:* Rs. ${order.netBill.toLocaleString()}\n` +
				`*Cash Received:* Rs. ${order.cashReceived.toLocaleString()}\n` +
				(openingBal !== 0 ? `*Opening Balance:* Rs. ${openingBal.toLocaleString()}\n` : "") +
				`*Final Balance Due:* Rs. ${order.finalBalance.toLocaleString()}\n` +
				`━━━━━━━━━━━━━━━━━━━━\n` +
				`Please report shortage within 3 days. Return/Exchange requires invoice.\n` +
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
				{/* Top Actions & Language Bar */}
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

					{/* Row 2: Print Language Switcher */}
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

				{/* Scrollable Receipt Body (On-screen preview matching legacy box receipt) */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-muted/15 flex justify-center print:p-0 print:m-0 print:bg-white">
					{/* 80mm Optimized Thermal Slip Container */}
					<div
						ref={printAreaRef}
						dir={language === "ur" ? "rtl" : "ltr"}
						className="w-full max-w-[340px] bg-white text-black p-3.5 sm:p-4 rounded-lg shadow-sm border border-neutral-300 font-sans text-xs leading-snug print:w-full print:max-w-none print:m-0 print:p-2 print:border-none print:shadow-none"
						style={{ height: "fit-content" }}
					>
						{/* Company Header */}
						<div className="text-center space-y-0.5 pb-1">
							<Image
								src="/logo.png"
								alt="Sarfraz Autos Logo"
								width={36}
								height={36}
								className="mx-auto mb-1 object-contain"
							/>
							<h1 className="font-black text-base tracking-wide text-black uppercase">
								{t.shopName}
							</h1>
							<p className="text-[10.5px] font-bold text-neutral-800 leading-tight">
								{t.address}
							</p>
							<p className="text-[10.5px] font-bold text-neutral-700">
								{t.cityPhone}
							</p>
							<div className="flex items-center justify-end text-[9px] text-neutral-600 pt-0.5">
								<span>{t.pageText}</span>
							</div>
						</div>

						{/* Customer Party Name (Underlined Header as shown in video) */}
						<div className="text-center py-1 my-1 border-t border-black">
							<p className="font-black text-sm uppercase tracking-wide underline">
								{order.customerName}
							</p>
						</div>

						{/* Invoice Meta Rows */}
						<div className="border-t border-black pt-1 space-y-0.5 text-[11px]">
							<div className="flex justify-between items-baseline">
								<span><strong>{t.invNo}</strong> <span className="font-mono">{order.invoiceNumber}</span></span>
								<span><strong>{t.date}</strong> {order.date}</span>
							</div>
							<div className="flex justify-between items-baseline text-neutral-900">
								<span><strong>{t.godown}</strong> <u>{translateGodown(order.godown)}</u></span>
							</div>
							<div className="flex justify-between items-baseline border-b-2 border-black pb-1 pt-0.5 font-semibold text-[9.5px]">
								<span>{order.dateTimeFull} {t.ownerLabel}</span>
								<span className="font-bold">
									{translatePayment(order.paymentMethod)}
									{order.paymentProofUrl ? (language === "ur" ? " (سلپ منسلک)" : " (Slip Attached)") : ""}
								</span>
							</div>
						</div>

						{/* Boxed Grid Table for Items */}
						<table className="w-full border-collapse border border-black mt-2 text-xs">
							<thead>
								<tr className="bg-neutral-100 font-bold border-b border-black text-[11.5px]">
									<th className="border border-black p-1 text-right w-[22%]">{t.tableTotal}</th>
									<th className="border border-black p-1 text-center w-[18%]">{t.tableRate}</th>
									<th className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"} w-[48%]`}>{t.tableItem}</th>
									<th className="border border-black p-1 text-center w-[12%]">{t.tableQty}</th>
								</tr>
							</thead>
							<tbody>
								{billRows.map((row, idx) => (
									<tr
										key={idx}
										className={row.isFree ? "bg-neutral-50 font-bold" : ""}
									>
										<td className="border border-black p-1 text-right font-mono font-bold text-[13px]">
											{row.totalDisplay}
										</td>
										<td className="border border-black p-1 text-center font-mono text-[11.5px] font-bold">
											{row.rateDisplay}
										</td>
										<td className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"}`}>
											<div className="font-black text-[13px] leading-tight text-black">{row.name}</div>
											{row.subLabel && (
												<div className="text-[10px] font-bold text-neutral-800 mt-0.5">{row.subLabel}</div>
											)}
										</td>
										<td className="border border-black p-1 text-center font-mono font-black text-sm">
											{row.qty}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Boxed Bottom Summary Section */}
						<table className="w-full border-collapse border-2 border-t-0 border-black text-xs">
							<tbody>
								{/* Total Amount & Total Quantity */}
								<tr className="border-b border-black font-bold">
									<td className="border border-black p-1 text-right font-mono w-[22%] font-black text-[13px]">
										{order.totalAmount.toLocaleString()}
									</td>
									<td className="border border-black p-1 text-center font-bold text-xs">
										{t.itemsCount}: {order.items.length}
									</td>
									<td className="border border-black p-1 text-center font-mono w-[12%] font-black text-sm">
										{totalDeliveredPieces}
									</td>
								</tr>

								{/* Discount if present */}
								{discountAmount > 0 && (
									<tr className="border-b border-black">
										<td className="border border-black p-1 text-right font-mono font-bold text-xs">
											-{discountAmount.toLocaleString()}
										</td>
										<td colSpan={2} className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"} text-[10.5px] font-bold`}>
											<strong>{t.discLabel}</strong> Trade Scheme Discount Relief
										</td>
									</tr>
								)}

								{/* Net Bill */}
								<tr className="border-b border-black font-bold">
									<td className="border border-black p-1 text-right font-mono text-sm font-black">
										{order.netBill.toLocaleString()}
									</td>
									<td colSpan={2} className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"} font-black text-[13px]`}>
										<strong>{t.netLabel}</strong>
									</td>
								</tr>

								{/* Cash Received */}
								<tr className="border-b border-black">
									<td className="border border-black p-1 text-right font-mono font-bold text-xs">
										{order.cashReceived.toLocaleString()}
									</td>
									<td colSpan={2} className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"} text-[11px] font-bold`}>
										<strong>{t.cashLabel}</strong>
									</td>
								</tr>

								{/* Opening Balance if applicable */}
								{openingBal !== 0 && (
									<tr className="border-b border-black">
										<td className="border border-black p-1 text-right font-mono font-bold">
											{openingBal.toLocaleString()}
										</td>
										<td colSpan={2} className={`border border-black p-1 ${language === "ur" ? "text-right" : "text-left"} text-[10px]`}>
											<strong>{t.openingLabel}</strong>
										</td>
									</tr>
								)}

								{/* Highlighted Final Balance Box (Double thick border as in video) */}
								<tr className="bg-neutral-100 border-t-2 border-black">
									<td className="border-2 border-black p-1.5 text-right font-mono font-black text-[15px]">
										{order.finalBalance.toLocaleString()}
									</td>
									<td colSpan={2} className={`border-2 border-black p-1.5 ${language === "ur" ? "text-right" : "text-left"} font-black text-[13.5px]`}>
										<strong>{t.finalLabel}</strong>
									</td>
								</tr>
							</tbody>
						</table>

						{/* Urdu Disclaimer & Policy Footer */}
						<div className="mt-3 pt-1.5 border-t border-black text-center font-bold text-[10.5px] text-neutral-900 leading-snug">
							<p>{t.termsNote1} {t.termsNote2}</p>
							<p className="text-[9.5px] font-normal text-neutral-700 mt-1">
								{t.warrantyNotice} • {t.thankYou}
							</p>
						</div>
					</div>
				</div>

				{/* Bottom Footer inside Sheet */}
				<SheetFooter className="px-4 py-2.5 border-t bg-muted/20 flex flex-row items-center justify-between print:hidden">
					<span className="text-[11px] text-muted-foreground truncate">
						Thermal slip formatted in legacy boxed grid structure.
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
