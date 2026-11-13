"use client";

import { useState } from "react";
import Link from "next/link";
import {
	HelpCircle,
	PhoneCall,
	MessageCircle,
	Camera,
	Video,
	Sparkles,
	AlertCircle,
	Copy,
	Check,
	Printer,
	ArrowRight,
	ExternalLink,
	ShieldCheck,
	Boxes,
	BadgeDollarSign,
	Clock,
	Terminal,
	Layers,
	ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEVELOPER_PHONE = "03152666263";
const DEVELOPER_PHONE_FORMATTED = "0315-2666263";
const DEVELOPER_WHATSAPP_LINK =
	"https://wa.me/923152666263?text=Salam%20Developer%2C%20I%20am%20contacting%20from%20Sarfraz%20Autos%20Shop%20Counter%20regarding%3A";

const FAQS = [
	{
		question: "How do I print receipts and thermal invoices for customers?",
		answer:
			"Go to 'Orders', click on the 'Invoice' button for any order. An A4 / POS receipt preview sheet will open on the right. Press 'Ctrl + P' or click the 'Print Invoice' button. It is optimized to automatically hide web navigation and only print clean invoice data.",
		category: "Billing & Printing",
	},
	{
		question: "How do I update prices when wholesale market rates increase or decrease?",
		answer:
			"Navigate to 'Inventory > Price Updater'. Filter by category (e.g. Engine & Transmission) or set price bounds (e.g. Min 100, Max 500), pick whether to Increase or Decrease by Percentage (%) or Fixed (Rs.), click 'Preview Price Changes', and then click 'Save & Apply'.",
		category: "Price Updater",
	},
	{
		question: "How does 3-branch stock distribution work?",
		answer:
			"Whenever you add or update a product's Total Stock quantity (e.g. 90 or 100), the system automatically divides the inventory equally among the 1st Branch (Saddar - Main Counter), 2nd Branch (Gulshan), and 3rd Branch (DHA). You can also manually adjust each branch count if one branch needs more stock.",
		category: "Inventory & Stock",
	},
	{
		question: "What should I do if the system breaks, an error shows, or data is missing?",
		answer:
			"Do not worry! Take a screenshot or record a quick phone video of your screen showing the issue, and send it directly to the developer's WhatsApp at 0315-2666263. The developer will inspect the logs and fix it immediately.",
		category: "Technical Support",
	},
	{
		question: "Can we add new custom features, reports, or counter integrations?",
		answer:
			"Yes! The software is built with modern modular architecture. Whether you need automated SMS notifications for dealers, thermal barcode sticker printers, or custom ledger exports, contact the developer to schedule feature deployment.",
		category: "Feature Requests",
	},
];

export function HelpCenterView() {
	const [copied, setCopied] = useState(false);
	const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

	const handleCopyNumber = () => {
		navigator.clipboard.writeText(DEVELOPER_PHONE);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-16">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
							<HelpCircle className="size-5" />
						</div>
						<div>
							<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
								Help Center & Support
							</h1>
						</div>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Direct developer hotline, rapid bug troubleshooting, feature requests, and operational guides for Sarfraz Autos.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-xs py-1 px-2.5 flex items-center gap-1.5 font-medium"
					>
						<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
						Developer Support Active
					</Badge>
				</div>
			</div>

			{/* HERO: DIRECT DEVELOPER WHATSAPP & HOTLINE CARD */}
			<div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 sm:p-8 shadow-sm space-y-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="space-y-2 max-w-xl">
						<div className="flex items-center gap-2">
							<Badge className="bg-emerald-600 text-white font-mono text-[11px] tracking-wider uppercase">
								Official Software Developer Hotline
							</Badge>
						</div>
						<h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
							Need Help or Want a New Feature?
						</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							If something breaks, any error occurs, or you want to add a brand new feature to the shop counter, you can contact the dedicated developer directly on WhatsApp or call anytime.
						</p>
					</div>

					{/* Big Phone & Action Button Container */}
					<div className="flex flex-col items-start md:items-end gap-3 shrink-0">
						<div className="flex items-center gap-2 bg-card border px-4 py-2 rounded-xl shadow-xs">
							<PhoneCall className="size-4 text-emerald-600 dark:text-emerald-400" />
							<span className="font-mono text-lg font-bold text-foreground tracking-wider">
								{DEVELOPER_PHONE_FORMATTED}
							</span>
							<button
								type="button"
								onClick={handleCopyNumber}
								title="Copy phone number"
								className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer ml-1"
							>
								{copied ? (
									<Check className="size-4 text-emerald-600 stroke-[3]" />
								) : (
									<Copy className="size-4" />
								)}
							</button>
						</div>

						{/* WhatsApp Action Button */}
						<a
							href={DEVELOPER_WHATSAPP_LINK}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all duration-200 active:scale-98"
						>
							<MessageCircle className="size-5 fill-current" />
							<span>Message on WhatsApp</span>
							<ExternalLink className="size-4 opacity-80" />
						</a>
					</div>
				</div>

				{/* 3 Action Advice Chips */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-border/60">
					<div className="p-3.5 rounded-xl border bg-background/80 flex items-start gap-3">
						<div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
							<Camera className="size-4" />
						</div>
						<div>
							<h4 className="text-xs font-semibold text-foreground">Send Screenshots</h4>
							<p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
								Take a screenshot of any bug or error message and send it directly on WhatsApp for an immediate fix.
							</p>
						</div>
					</div>

					<div className="p-3.5 rounded-xl border bg-background/80 flex items-start gap-3">
						<div className="size-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
							<Video className="size-4" />
						</div>
						<div>
							<h4 className="text-xs font-semibold text-foreground">Record Video / Screen</h4>
							<p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
								Record a quick phone video or screen clip showing what happened during billing, printing, or restocking.
							</p>
						</div>
					</div>

					<div className="p-3.5 rounded-xl border bg-background/80 flex items-start gap-3">
						<div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
							<Sparkles className="size-4" />
						</div>
						<div>
							<h4 className="text-xs font-semibold text-foreground">Request New Features</h4>
							<p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
								Want a new receipt layout, WhatsApp PDF order dispatch, or bulk supplier invoices? Message the developer anytime.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* SUPPORT CHANNELS GRID */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Channel 1: WhatsApp Support */}
				<div className="rounded-xl border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
					<div className="space-y-2">
						<div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
							<MessageCircle className="size-4" />
						</div>
						<h3 className="font-heading font-semibold text-sm text-foreground">
							WhatsApp Developer Chat
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Fastest channel for day-to-day inquiries, screenshot sharing, and rapid code fixes.
						</p>
					</div>

					<div className="pt-2">
						<a
							href={DEVELOPER_WHATSAPP_LINK}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
						>
							Chat on 0315-2666263 &rarr;
						</a>
					</div>
				</div>

				{/* Channel 2: Urgent Voice Hotline */}
				<div className="rounded-xl border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
					<div className="space-y-2">
						<div className="size-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
							<PhoneCall className="size-4" />
						</div>
						<h3 className="font-heading font-semibold text-sm text-foreground">
							Emergency Counter Call
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Available during shop trading hours for counter stoppage, printer disconnects, or database sync problems.
						</p>
					</div>

					<div className="pt-2">
						<a
							href={`tel:${DEVELOPER_PHONE}`}
							className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
						>
							Call 0315 2666263 &rarr;
						</a>
					</div>
				</div>

				{/* Channel 3: System Health & Diagnostics */}
				<div className="rounded-xl border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
					<div className="space-y-2">
						<div className="size-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
							<Terminal className="size-4" />
						</div>
						<h3 className="font-heading font-semibold text-sm text-foreground">
							Live System Diagnostics
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Inspect real-time latency, branch terminal connectivity, server health, and POS status logs.
						</p>
					</div>

					<div className="pt-2">
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs font-medium cursor-pointer w-full"
							render={<Link href="/dashboard/system-health" />}
							nativeButton={false}
						>
							<span>View System Health</span>
							<ArrowRight className="size-3 ml-1" />
						</Button>
					</div>
				</div>
			</div>

			{/* OPERATOR FAQs & QUICK TROUBLESHOOTING */}
			<div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
				<div className="border-b pb-3">
					<h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
						<HelpCircle className="size-4 text-primary" />
						Frequently Asked Questions & Shop Guides
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Quick solutions for common counter operations, printer setup, and inventory distribution.
					</p>
				</div>

				<div className="space-y-2.5">
					{FAQS.map((faq, index) => {
						const isOpen = openFaqIndex === index;
						return (
							<div
								key={faq.question}
								className="rounded-lg border bg-muted/20 overflow-hidden transition-all"
							>
								<button
									type="button"
									onClick={() => setOpenFaqIndex(isOpen ? null : index)}
									className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
								>
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-[10px] font-normal">
											{faq.category}
										</Badge>
										<span className="font-semibold text-xs text-foreground">
											{faq.question}
										</span>
									</div>
									<ChevronDown
										className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
											isOpen ? "rotate-180" : ""
										}`}
									/>
								</button>
								{isOpen && (
									<div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground border-t border-border/40 leading-relaxed bg-background/50">
										{faq.answer}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* SYSTEM DIAGNOSTICS & HARDWARE SPECIFICATIONS */}
			<div className="rounded-xl border bg-muted/30 p-5 space-y-3 text-xs">
				<h4 className="font-semibold text-foreground flex items-center gap-1.5">
					<Boxes className="size-3.5 text-primary" />
					Sarfraz Autos Counter Information
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
					<div className="p-2.5 rounded-lg border bg-card space-y-1">
						<span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
							Active Branches
						</span>
						<p className="font-medium text-foreground text-xs">
							Saddar (Main), Gulshan, DHA
						</p>
					</div>

					<div className="p-2.5 rounded-lg border bg-card space-y-1">
						<span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
							Receipt Format
						</span>
						<p className="font-medium text-foreground text-xs">
							80mm Thermal Receipt + A4 Standard
						</p>
					</div>

					<div className="p-2.5 rounded-lg border bg-card space-y-1">
						<span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
							Warranty Standard
						</span>
						<p className="font-medium text-foreground text-xs">
							7-Day Spare Parts Checking Warranty
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

