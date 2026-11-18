"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchProducts } from "@/lib/api/products/products-api";
import { fetchCustomers } from "@/lib/api/customers/customers-api";
import { createOrder } from "@/lib/api/orders/orders-api";
import {
	Store,
	Search,
	Plus,
	Minus,
	Trash2,
	Printer,
	Receipt,
	CheckCircle2,
	AlertTriangle,
	Clock,
	Bike,
	User,
	Calculator,
	Banknote,
	ArrowRight,
	Check,
	X,
	Layers,
	BadgePercent,
	FileText,
	Sparkles,
	CreditCard,
	Share2,
	Loader2,
	Gift,
	Tag,
	Flame,
	Paperclip,
	Smartphone,
	Upload,
	Eye,
	ExternalLink,
	ImageIcon,
	Zap,
	RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	BRANCHES,
	BIKE_MODELS,
	DEFAULT_WALKIN_CUSTOMER,
	type BranchId,
	type CounterCartItem,
	type CustomerProfile,
} from "./types";
import { INITIAL_PRODUCTS, type ProductItem } from "@/components/Products/types";
import { InvoiceSheet } from "@/components/Orders/invoice-sheet";
import { CustomerSearchSelect } from "./customer-search-select";
import type { OrderRecord } from "@/components/Orders/types";
import Link from "next/link";

const LOCAL_STORAGE_BRANCH_KEY = "sarfraz_active_branch_id";
const DEFAULT_WARRANTY_POLICY =
	"7 Days Check Warranty Only (Return / Exchange within 7 days)";

export interface ItemSchemeCalculation {
	hasScheme: boolean;
	title: string;
	shortLabel: string;
	schemeType: "buy_x_get_y" | "net_rate" | "flat_discount" | "none";
	buyQuantity: number;
	freeQuantityPerTier: number;
	freeUnits: number;
	nextFreeAt: number;
	isEligible: boolean;
	effectiveRate: number;
	savingsAmount: number;
	totalDeliveredUnits: number;
}

export function calculateNetRate(
	baseRate: number,
	tradeScheme?: {
		buyQuantity?: number;
		freeQuantity?: number;
		netSchemeRate?: number | string | null;
	} | null
): number {
	if (!tradeScheme) return baseRate;
	const buyQty = Number(tradeScheme.buyQuantity) || 10;
	const freeQty = Number(tradeScheme.freeQuantity) || 1;
	if (buyQty + freeQty <= 0) return baseRate;
	// Dynamic scheme formula requested by client: Rate * Buy Qty / (Buy Qty + Free Qty)
	// e.g. Transmission 14+1: 3398 * 14 / 15 = 3171 (or wholesale 2955 * 14 / 15 = 2758)
	// Clutch Plate 10+1: 163 * 10 / 11 = 148, 137 * 10 / 11 = 125
	return Math.round((baseRate * buyQty) / (buyQty + freeQty));
}

export function calculateItemScheme(item: CounterCartItem): ItemSchemeCalculation {
	const scheme = item.tradeScheme;
	if (!scheme || scheme.status !== "Active" || item.isSchemeDisabled) {
		return {
			hasScheme: false,
			title: item.isSchemeDisabled ? "Scheme Disabled" : "",
			shortLabel: item.isSchemeDisabled ? "Scheme Off" : "",
			schemeType: "none",
			buyQuantity: 0,
			freeQuantityPerTier: 0,
			freeUnits: 0,
			nextFreeAt: 0,
			isEligible: false,
			effectiveRate: item.rate,
			savingsAmount: 0,
			totalDeliveredUnits: item.quantity,
		};
	}

	const qty = item.quantity || 0;
	const buyQty = scheme.buyQuantity > 0 ? scheme.buyQuantity : 10;
	const freePerTier = scheme.freeQuantity > 0 ? scheme.freeQuantity : 1;

	// 1. NET SCHEME MODE (Cash Discount instead of Free Inventory, matching legacy software)
	if (item.isSchemeActive) {
		const baseRate = item.pricingTier === "Retail" ? item.retailRate : item.wholesaleRate;
		const netRate = calculateNetRate(baseRate, scheme);
		const savingsPerUnit = Math.max(0, baseRate - netRate);
		const totalSavings = savingsPerUnit * qty;

		return {
			hasScheme: true,
			title: `${scheme.title} (Net Scheme)`,
			shortLabel: `Net Rs. ${netRate}`,
			schemeType: "net_rate",
			buyQuantity: buyQty,
			freeQuantityPerTier: 0,
			freeUnits: 0, // STRICTLY ZERO FREE UNITS IN NET SCHEME!
			nextFreeAt: 0,
			isEligible: true,
			effectiveRate: netRate,
			savingsAmount: totalSavings,
			totalDeliveredUnits: qty, // Only billed units are delivered
		};
	}

	// 2. NORMAL SCHEME MODE (Physical Free Bonus Units Delivered e.g. 10 + 1 Free)
	if (scheme.schemeType === "buy_x_get_y" || !scheme.schemeType || scheme.schemeType === "flat_discount") {
		const freeUnits = Math.floor(qty / buyQty) * freePerTier;
		const remainder = qty % buyQty;
		const nextFreeAt = remainder === 0 ? buyQty : buyQty - remainder;
		const totalDelivered = qty + freeUnits;
		const lineSubtotal = item.rate * qty;
		const effectiveRate = totalDelivered > 0 ? Math.round(lineSubtotal / totalDelivered) : item.rate;
		const savingsAmount = freeUnits * item.rate;
		const shortLabel = `${buyQty} + ${freePerTier} Free`;

		return {
			hasScheme: true,
			title: scheme.title,
			shortLabel,
			schemeType: "buy_x_get_y",
			buyQuantity: buyQty,
			freeQuantityPerTier: freePerTier,
			freeUnits,
			nextFreeAt,
			isEligible: freeUnits > 0,
			effectiveRate,
			savingsAmount,
			totalDeliveredUnits: totalDelivered,
		};
	}

	if (scheme.schemeType === "net_rate") {
		const netRate = calculateNetRate(item.wholesaleRate, scheme);
		const isEligible = qty >= buyQty;
		const effectiveRate = isEligible ? netRate : item.rate;
		const savingsAmount = isEligible ? Math.max(0, (item.wholesaleRate - netRate) * qty) : 0;
		const shortLabel = `Net Rs. ${netRate}`;

		return {
			hasScheme: true,
			title: scheme.title,
			shortLabel,
			schemeType: "net_rate",
			buyQuantity: buyQty,
			freeQuantityPerTier: 0,
			freeUnits: 0,
			nextFreeAt: Math.max(0, buyQty - qty),
			isEligible,
			effectiveRate,
			savingsAmount,
			totalDeliveredUnits: qty,
		};
	}

	return {
		hasScheme: true,
		title: scheme.title,
		shortLabel: "Scheme Active",
		schemeType: "none",
		buyQuantity: buyQty,
		freeQuantityPerTier: freePerTier,
		freeUnits: 0,
		nextFreeAt: 0,
		isEligible: false,
		effectiveRate: item.rate,
		savingsAmount: 0,
		totalDeliveredUnits: qty,
	};
}

export function CounterView() {
	const queryClient = useQueryClient();

	// Branch selection with localStorage persistence
	const [activeBranchId, setActiveBranchId] = useState<BranchId>("main");
	const [isHydrated, setIsHydrated] = useState(false);

	// Load stored branch from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_BRANCH_KEY);
			if (saved && (saved === "main" || saved === "branch-2" || saved === "branch-3")) {
				setActiveBranchId(saved as BranchId);
			}
		} catch {
			// ignore storage access restrictions
		}
		setIsHydrated(true);
	}, []);

	// Handle branch change with persistence
	const handleBranchChange = (newBranchId: BranchId) => {
		setActiveBranchId(newBranchId);
		try {
			localStorage.setItem(LOCAL_STORAGE_BRANCH_KEY, newBranchId);
		} catch {
			// ignore
		}
	};

	const currentBranch = useMemo(() => {
		return BRANCHES.find((b) => b.id === activeBranchId) || BRANCHES[0];
	}, [activeBranchId]);

	// Customer state with live Khata ledger data - starts clean
	const [customer, setCustomer] = useState<CustomerProfile>(DEFAULT_WALKIN_CUSTOMER);

	// Cart items state - starts empty from zero
	const [cart, setCart] = useState<CounterCartItem[]>([]);

	// Product Search & Filter state - Target Bike Model defaults to "All Models"
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [isDebouncing, setIsDebouncing] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedBikeModel, setSelectedBikeModel] = useState<string>("All Models");
	const [selectedPricingTier, setSelectedPricingTier] = useState<"Retail" | "Wholesale">("Wholesale");
	const [inputQuantity, setInputQuantity] = useState<number>(1);
	const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

	const handlePricingTierChange = (tier: "Retail" | "Wholesale") => {
		setSelectedPricingTier(tier);
		if (customer.id === "walkin") {
			setCustomer((prev) => ({
				...prev,
				type: tier === "Retail" ? "Retail Customer" : "Wholesale Dealer",
			}));
		}
	};

	// Debounce user typing by 400ms before querying PostgreSQL database
	useEffect(() => {
		if (!searchQuery.trim()) {
			setDebouncedSearchQuery("");
			setIsDebouncing(false);
			return;
		}

		setIsDebouncing(true);
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
			setIsDebouncing(false);
		}, 400);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Live database query for searching real products from PostgreSQL Neon database
	const {
		data: searchResultsData,
		isLoading: isSearchingApi,
		isFetching: isFetchingApi,
	} = useQuery({
		queryKey: [
			"products",
			"counter-search",
			{
				search: debouncedSearchQuery,
				branchId: activeBranchId,
				bikeModel: selectedBikeModel !== "All Models" ? selectedBikeModel : undefined,
				category: selectedCategory !== "All" ? selectedCategory : undefined,
			},
		],
		queryFn: () =>
			fetchProducts({
				search: debouncedSearchQuery,
				branchId: activeBranchId,
				bikeModel: selectedBikeModel !== "All Models" ? selectedBikeModel : undefined,
				category: selectedCategory !== "All" ? selectedCategory : undefined,
				limit: 20,
			}),
		enabled: debouncedSearchQuery.length > 0,
		staleTime: 1000 * 60 * 2,
	});

	const searchResults: ProductItem[] = searchResultsData?.data || [];
	const isSearchLoading = searchQuery.trim().length > 0 && (isDebouncing || isSearchingApi || isFetchingApi);

	// Financials & Register
	const [discountMode, setDiscountMode] = useState<"fixed" | "percent">("fixed");
	const [discountInput, setDiscountInput] = useState<string>("0");
	const [shippingOrFitting, setShippingOrFitting] = useState<number>(0);
	const [cashReceived, setCashReceived] = useState<number>(0);
	const [registerPaymentMode, setRegisterPaymentMode] = useState<"cash" | "online" | "split" | "credit">("cash");
	const [onlineReceived, setOnlineReceived] = useState<number>(0);
	const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
	const [isUploadingSlip, setIsUploadingSlip] = useState(false);
	const [previewSlipModalOpen, setPreviewSlipModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);
	const [errorNotice, setErrorNotice] = useState<string | null>(null);

	// Invoice Sheet Modal
	const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

	// Clock display - only shows live timing as requested
	const [currentTime, setCurrentTime] = useState<string>("");
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString("en-PK", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true,
				})
			);
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Stock lookup helper for active branch
	const getBranchStock = (product: ProductItem): number => {
		const branchObj = product.branches?.find((b) => b.branchId === activeBranchId);
		return branchObj ? branchObj.stock : Math.floor((product.totalStock || 0) / 3);
	};

	// Add item to cart
	const handleAddCatalogItem = (product: ProductItem) => {
		// Zero-Quantity check: Cannot add more items if any existing cart item has 0 or empty quantity
		const pendingZeroItem = cart.find((ci) => !ci.quantity || ci.quantity <= 0);
		if (pendingZeroItem) {
			showErrorNotice(
				`Pehle "${pendingZeroItem.name}" ki quantity darj karein ya usay cart se delete karein!`
			);
			return;
		}

		const stock = getBranchStock(product);
		const rate =
			selectedPricingTier === "Retail"
				? Math.round(product.retailPrice || product.price * 1.15)
				: product.price;
		const netSchemeRate = calculateNetRate(rate, product.tradeScheme);
		const targetModel = selectedBikeModel === "All Models" ? product.bikeModel : selectedBikeModel;

		setCart((prev) => {
			const existingIndex = prev.findIndex(
				(item) => item.productId === product.id && item.bikeModel === targetModel
			);
			if (existingIndex > -1) {
				const updated = [...prev];
				updated[existingIndex] = {
					...updated[existingIndex],
					quantity: (updated[existingIndex].quantity || 0) + (inputQuantity || 1),
					tradeScheme: product.tradeScheme || updated[existingIndex].tradeScheme,
				};
				return updated;
			}
			const newItem: CounterCartItem = {
				id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
				productId: product.id,
				sku: product.sku,
				name: product.name,
				bikeModel: targetModel,
				category: product.category,
				rate: rate,
				retailRate: Math.round(product.retailPrice || product.price * 1.15),
				wholesaleRate: product.price,
				schemeRate: netSchemeRate,
				isSchemeActive: false, // Default to Normal Scheme (10+1 free pieces)
				tradeScheme: product.tradeScheme || null,
				quantity: inputQuantity > 0 ? inputQuantity : 1,
				unit: product.unit,
				branchStock: stock,
				pricingTier: selectedPricingTier,
				imageUrl: product.imageUrl,
			};
			return [newItem, ...prev];
		});

		setSearchQuery("");
		setInputQuantity(1);
		showFlashNotice(
			product.tradeScheme
				? `Added "${product.name}" (🎁 Scheme Available: ${product.tradeScheme.title})`
				: `Added "${product.name}" to counter cart`
		);
	};

	// Cart manipulations
	const updateQuantity = (id: string, delta: number) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const current = item.quantity || 0;
					const nextQty = Math.max(1, current + delta);
					return { ...item, quantity: nextQty };
				}
				return item;
			})
		);
	};

	// Direct numeric quantity entry
	const setDirectQuantity = (id: string, qty: number) => {
		const validQty = isNaN(qty) ? 0 : Math.max(0, qty);
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, quantity: validQty } : item))
		);
	};

	// 1-Click Wholesale Net Scheme Rate Toggle (Requested in Video 1 & Video 3)
	const toggleNetScheme = (id: string) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const willBeActive = !item.isSchemeActive;
					const standardRate =
						item.pricingTier === "Retail" ? item.retailRate : item.wholesaleRate;
					const netRate = calculateNetRate(standardRate, item.tradeScheme);
					return {
						...item,
						isSchemeActive: willBeActive,
						rate: willBeActive ? netRate : standardRate,
					};
				}
				return item;
			})
		);
		showFlashNotice("Toggled Wholesale Trade Scheme");
	};

	// 1-Click Toggle Scheme Disabled / Enabled (Check & Cross option requested by client to sell at standard rate with 0 free)
	const toggleSchemeDisabled = (id: string) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const willBeDisabled = !item.isSchemeDisabled;
					const standardRate =
						item.pricingTier === "Retail" ? item.retailRate : item.wholesaleRate;
					return {
						...item,
						isSchemeDisabled: willBeDisabled,
						// If turning off scheme, ensure net scheme is also turned off and rate is standard rate
						isSchemeActive: willBeDisabled ? false : item.isSchemeActive,
						rate: willBeDisabled ? standardRate : item.isSchemeActive ? item.rate : standardRate,
					};
				}
				return item;
			})
		);
		showFlashNotice("Updated Scheme status for item");
	};

	// Master Net Scheme controls for entire cart
	const [isNetSchemeModalOpen, setIsNetSchemeModalOpen] = useState(false);

	const schemeEligibleCount = cart.filter((ci) => Boolean(ci.tradeScheme) && !ci.isSchemeDisabled).length;
	const allNetSchemeActive =
		schemeEligibleCount > 0 &&
		cart.filter((ci) => Boolean(ci.tradeScheme) && !ci.isSchemeDisabled).every((ci) => ci.isSchemeActive);

	const handleApplyAllNetScheme = (enable: boolean) => {
		setCart((prev) =>
			prev.map((item) => {
				if (!item.tradeScheme || item.isSchemeDisabled) return item;
				const standardRate =
					item.pricingTier === "Retail" ? item.retailRate : item.wholesaleRate;
				const netRate = calculateNetRate(standardRate, item.tradeScheme);
				return {
					...item,
					isSchemeActive: enable,
					rate: enable ? netRate : standardRate,
				};
			})
		);
		setIsNetSchemeModalOpen(false);
		showFlashNotice(
			enable
				? "⚡ Applied Net Scheme to all eligible cart items"
				: "🎁 Reverted all items to Normal 10+1 Free Scheme"
		);
	};

	// Quick Customer Switcher
	const handleSelectCustomer = (selected: CustomerProfile | string) => {
		if (typeof selected === "string") {
			if (selected === "walkin") {
				setCustomer(DEFAULT_WALKIN_CUSTOMER);
				showFlashNotice("Loaded Walk-in Wholesale Customer");
			}
		} else {
			setCustomer(selected);
			if (selected.paymentMethod === "Credit / Khata") {
				setCashReceived(0);
			}
			showFlashNotice(`Loaded ${selected.name} (Khata: Rs. ${(selected.currentBalance || 0).toLocaleString()})`);
		}
	};

	const updateItemRate = (id: string, newRate: number) => {
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, rate: Math.max(0, newRate) } : item))
		);
	};

	const updateItemModel = (id: string, newModel: string) => {
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, bikeModel: newModel } : item))
		);
	};

	const removeItem = (id: string) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	// Reset all counter states back to fresh zero state for the next sale/invoice
	const resetCounter = () => {
		setCart([]);
		setCustomer(DEFAULT_WALKIN_CUSTOMER);
		setSearchQuery("");
		setDebouncedSearchQuery("");
		setInputQuantity(1);
		setSelectedCategory("All");
		setSelectedBikeModel("All Models");
		setSelectedPricingTier("Wholesale");
		setDiscountMode("fixed");
		setDiscountInput("0");
		setShippingOrFitting(0);
		setCashReceived(0);
		setOnlineReceived(0);
		setRegisterPaymentMode("cash");
		setPaymentSlipUrl(null);
		setPreviewSlipModalOpen(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleNewSale = () => {
		const hasData = cart.length > 0 || customer.id !== "walkin" || customer.phone || cashReceived > 0 || onlineReceived > 0;
		if (hasData) {
			if (confirm("Reset counter and start a fresh blank sale?")) {
				resetCounter();
				showFlashNotice("Counter reset to blank state.");
			}
		} else {
			resetCounter();
			showFlashNotice("Counter reset.");
		}
	};

	const clearCart = () => {
		if (cart.length === 0) return;
		if (confirm("Clear current counter cart?")) {
			setCart([]);
			setDiscountMode("fixed");
			setDiscountInput("0");
			setShippingOrFitting(0);
			setCashReceived(0);
			setOnlineReceived(0);
			showFlashNotice("Counter cart cleared");
		}
	};

	// Flash notification helper
	const showFlashNotice = (msg: string) => {
		setSuccessNotice(msg);
		setTimeout(() => setSuccessNotice(null), 3000);
	};

	const showErrorNotice = (msg: string) => {
		setErrorNotice(msg);
		setTimeout(() => setErrorNotice(null), 6000);
	};

	// Totals calculations
	const subtotal = useMemo(() => {
		return cart.reduce((sum, item) => sum + item.rate * item.quantity, 0);
	}, [cart]);

	// Auto-calculated Counter Discount (supports Flat PKR or Percentage %)
	const discountValue = useMemo(() => {
		const raw = parseFloat(discountInput.replace(/[^0-9.]/g, "")) || 0;
		if (discountMode === "percent") {
			return Math.min(subtotal, Math.round((subtotal * Math.max(0, raw)) / 100));
		}
		return Math.min(subtotal, Math.max(0, raw));
	}, [subtotal, discountMode, discountInput]);

	const handleSwitchDiscountToPercent = () => {
		if (discountMode === "percent") return;
		setDiscountMode("percent");
		const cur = parseFloat(discountInput) || 0;
		if (subtotal > 0 && cur > 0 && cur <= subtotal) {
			const pct = ((cur / subtotal) * 100).toFixed(1).replace(/\.0$/, "");
			setDiscountInput(pct);
		}
	};

	const handleSwitchDiscountToFixed = () => {
		if (discountMode === "fixed") return;
		setDiscountMode("fixed");
		setDiscountInput(String(discountValue));
	};

	const handleDiscountInputChange = (val: string) => {
		if (val.includes("%")) {
			setDiscountMode("percent");
			setDiscountInput(val.replace(/%/g, "").trim());
		} else {
			setDiscountInput(val);
		}
	};

	const totalItemsCount = useMemo(() => {
		return cart.reduce((sum, item) => sum + item.quantity, 0);
	}, [cart]);

	// Trade Scheme Benefits and Free Units aggregation
	const cartSchemesSummary = useMemo(() => {
		let totalFreeUnits = 0;
		let totalSchemeSavings = 0;
		const activeSchemeItems: {
			id: string;
			name: string;
			unit: string;
			quantity: number;
			freeUnits: number;
			totalDelivered: number;
			schemeTitle: string;
			shortLabel: string;
			schemeType: string;
			effectiveRate: number;
			savings: number;
			isEligible: boolean;
			nextFreeAt: number;
		}[] = [];

		cart.forEach((item) => {
			const info = calculateItemScheme(item);
			if (info.hasScheme) {
				if (info.freeUnits > 0) {
					totalFreeUnits += info.freeUnits;
				}
				if (info.savingsAmount > 0) {
					totalSchemeSavings += info.savingsAmount;
				}
				activeSchemeItems.push({
					id: item.id,
					name: item.name,
					unit: item.unit,
					quantity: item.quantity,
					freeUnits: info.freeUnits,
					totalDelivered: info.totalDeliveredUnits,
					schemeTitle: info.title,
					shortLabel: info.shortLabel,
					schemeType: info.schemeType,
					effectiveRate: info.effectiveRate,
					savings: info.savingsAmount,
					isEligible: info.isEligible,
					nextFreeAt: info.nextFreeAt,
				});
			}
		});

		return {
			totalFreeUnits,
			totalSchemeSavings,
			activeSchemeItems,
			hasAnyScheme: activeSchemeItems.length > 0,
		};
	}, [cart]);

	const netBill = useMemo(() => {
		const total = subtotal - (discountValue || 0) + (shippingOrFitting || 0);
		return Math.max(0, total);
	}, [subtotal, discountValue, shippingOrFitting]);

	// Auto match received payments based on active payment mode
	useEffect(() => {
		if (registerPaymentMode === "cash") {
			setCashReceived(netBill);
			setOnlineReceived(0);
		} else if (registerPaymentMode === "online") {
			setCashReceived(0);
			setOnlineReceived(netBill);
		} else if (registerPaymentMode === "split") {
			const half = Math.round(netBill / 2);
			if (cashReceived === 0 && onlineReceived === 0) {
				setCashReceived(half);
				setOnlineReceived(netBill - half);
			}
		} else if (registerPaymentMode === "credit") {
			setCashReceived(0);
			setOnlineReceived(0);
		}
	}, [netBill, registerPaymentMode]);

	const totalReceived = useMemo(() => {
		if (registerPaymentMode === "cash") return cashReceived || 0;
		if (registerPaymentMode === "online") return onlineReceived || 0;
		if (registerPaymentMode === "split") return (cashReceived || 0) + (onlineReceived || 0);
		return 0;
	}, [registerPaymentMode, cashReceived, onlineReceived]);

	const changeReturn = useMemo(() => {
		return totalReceived - netBill;
	}, [totalReceived, netBill]);

	// Upload WhatsApp slip image to Vercel Blob
	const handleUploadSlipFile = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			showErrorNotice("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
			return;
		}

		setIsUploadingSlip(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "payment-slips");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Failed to upload to Vercel Blob");
			}

			setPaymentSlipUrl(json.url);
			showFlashNotice("WhatsApp payment slip attached successfully!");
		} catch (err: any) {
			console.error("Upload slip error:", err);
			showErrorNotice(err.message || "Failed to upload payment slip");
		} finally {
			setIsUploadingSlip(false);
		}
	};

	// Global Clipboard Paste listener (Ctrl+V) from WhatsApp Web / Desktop
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				if (items[i].type.startsWith("image/")) {
					const blob = items[i].getAsFile();
					if (blob) {
						e.preventDefault();
						const pastedFile = new File(
							[blob],
							`whatsapp-slip-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`,
							{ type: blob.type }
						);
						// Automatically switch to online mode if not already
						if (registerPaymentMode === "cash") {
							setRegisterPaymentMode("online");
							setCashReceived(0);
							setOnlineReceived(netBill);
						}
						handleUploadSlipFile(pastedFile);
						break;
					}
				}
			}
		};

		window.addEventListener("paste", handlePaste);
		return () => window.removeEventListener("paste", handlePaste);
	}, [registerPaymentMode, netBill]);

	// Generate Printable Invoice
	const handleCreateInvoice = async (action: "print" | "save") => {
		if (cart.length === 0 || isSubmittingOrder) {
			if (cart.length === 0) {
				showErrorNotice("Cart is empty. Please add spare parts before issuing an invoice.");
			}
			return;
		}

		// Validation: check if any item has empty or 0 quantity
		const emptyQtyItems = cart.filter((item) => !item.quantity || item.quantity <= 0);
		if (emptyQtyItems.length > 0) {
			const itemNames = emptyQtyItems.map((item) => `"${item.name}"`).join(", ");
			showErrorNotice(
				`Cannot generate invoice: Quantity for ${itemNames} is empty or 0. Please enter a valid quantity or delete the item from the cart.`
			);
			return;
		}

		setIsSubmittingOrder(true);
		try {
			const invoiceNo = `SA-${Math.floor(10000 + Math.random() * 90000)}`;
			const orderId = `#${invoiceNo}`;

			const totalFreeBonus = cartSchemesSummary.totalFreeUnits;
			const netSchemeCount = cart.filter((ci) => !ci.isSchemeDisabled && ci.isSchemeActive).length;
			let schemeRemarks = DEFAULT_WARRANTY_POLICY;
			if (totalFreeBonus > 0 && netSchemeCount > 0) {
				schemeRemarks += ` | 🎁 Trade Schemes: +${totalFreeBonus} Free Bonus Units & ⚡ ${netSchemeCount} items billed on Net Scheme (Cash Discount)`;
			} else if (totalFreeBonus > 0) {
				schemeRemarks += ` | 🎁 Trade Scheme Applied: +${totalFreeBonus} Free Bonus Units Delivered`;
			} else if (netSchemeCount > 0) {
				schemeRemarks += ` | ⚡ Net Scheme Applied: ${netSchemeCount} items billed on Net Cash Discount (0 Free)`;
			}

			const generatedOrder: OrderRecord = {
				id: orderId,
				invoiceNumber: invoiceNo,
				customerName: customer.name || "Walk-in Retail Customer",
				customerCity: customer.city || "Karachi",
				customerPhone: customer.phone,
				branchId: activeBranchId,
				branchName: currentBranch.name,
				branchShortName: currentBranch.shortName,
				type: customer.type.includes("Wholesale") ? "Wholesale" : "Retail",
				items: cart.map((ci) => {
					const sch = calculateItemScheme(ci);
					const isSchemeOn = !ci.isSchemeDisabled;
					const schemeTag = (isSchemeOn && ci.isSchemeActive)
						? " [⚡ Net Scheme]"
						: (isSchemeOn && sch.freeUnits > 0)
						? ` [🎁 +${sch.freeUnits} Free Bonus Included]`
						: "";
					return {
						name: ci.name,
						subLabel: `${ci.bikeModel.toUpperCase()} (${ci.category})${schemeTag}`,
						quantity: ci.quantity,
						rate: ci.rate,
						total: ci.rate * ci.quantity,
						originalRate: ci.wholesaleRate || ci.rate,
						discountedRate: (isSchemeOn && ci.isSchemeActive)
							? ci.rate
							: (isSchemeOn && sch.hasScheme && sch.effectiveRate !== ci.rate)
							? sch.effectiveRate
							: undefined,
						freeQuantity: (isSchemeOn && sch.freeUnits > 0) ? sch.freeUnits : undefined,
						isNetScheme: Boolean(isSchemeOn && ci.isSchemeActive),
						schemeType: (isSchemeOn && ci.isSchemeActive)
							? "net_scheme"
							: (isSchemeOn && sch.freeUnits > 0)
							? "normal_scheme"
							: "none",
					};
				}),
				totalQuantity: totalItemsCount,
				subtotalAmount: subtotal,
				totalAmount: subtotal,
				shippingCharges: shippingOrFitting,
				cashReceived: registerPaymentMode === "online" ? 0 : registerPaymentMode === "credit" ? 0 : cashReceived,
				onlineReceived: registerPaymentMode === "online" ? onlineReceived : registerPaymentMode === "split" ? onlineReceived : 0,
				netBill: netBill,
				finalBalance: changeReturn < 0 ? Math.abs(changeReturn) : 0,
				discountAmount: discountValue,
				openingBalance: customer.currentBalance ?? customer.openingBalance ?? 0,
				status: "Completed",
				paymentProofUrl: paymentSlipUrl || undefined,
				date: new Date().toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				}),
				dateTimeFull: `${new Date()
					.toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "short",
						year: "2-digit",
					})
					.toUpperCase()} ${currentTime || "12:00 PM"}`,
				paymentMethod:
					registerPaymentMode === "online"
						? "Online Transfer"
						: registerPaymentMode === "split"
						? "Split (Cash + Online)"
						: registerPaymentMode === "credit" || customer.paymentMethod === "Credit / Khata"
						? "On Credit / COD"
						: customer.paymentMethod === "Online Transfer"
						? "Online Transfer"
						: "Cash on Counter",
				godown: currentBranch.name.toUpperCase(),
				remarks: schemeRemarks,
			};

			// Push order to Neon PostgreSQL database
			await createOrder({
				customerId: customer.id || "walkin",
				customerName: customer.name || "Walk-in Retail Rider",
				customerPhone: customer.phone || "0300-0000000",
				customerCity: customer.city || "Karachi",
				branchId: activeBranchId,
				orderType: customer.type.includes("Wholesale") ? "Wholesale" : "Retail",
				paymentMethod:
					registerPaymentMode === "online"
						? "Online Transfer"
						: registerPaymentMode === "split"
						? "Split (Cash + Online)"
						: registerPaymentMode === "credit" || customer.paymentMethod === "Credit / Khata"
						? "Credit / Khata"
						: customer.paymentMethod,
				paymentProofUrl: paymentSlipUrl || null,
				items: cart.map((ci) => {
					const sch = calculateItemScheme(ci);
					const isSchemeOn = !ci.isSchemeDisabled;
					return {
						productId: ci.productId || ci.id,
						productName: ci.name,
						sku: ci.sku || "SKU-GEN",
						bikeModel: ci.bikeModel,
						category: ci.category,
						unitRate: ci.rate,
						pricingTier: (isSchemeOn && ci.isSchemeActive) ? "Net Scheme" : ci.pricingTier,
						isSchemeApplied: Boolean(isSchemeOn && (ci.isSchemeActive || sch.hasScheme)),
						schemeRate: (isSchemeOn && ci.isSchemeActive)
							? ci.rate
							: (isSchemeOn && (ci.schemeRate || (sch.hasScheme ? sch.effectiveRate : null))),
						quantity: ci.quantity,
						lineTotal: ci.rate * ci.quantity,
					};
				}),
				subtotalAmount: subtotal,
				discountAmount: discountValue,
				shippingCharges: shippingOrFitting,
				totalAmount: netBill,
				cashReceived: registerPaymentMode === "online" ? 0 : registerPaymentMode === "credit" ? 0 : cashReceived,
				onlineReceived: registerPaymentMode === "online" ? onlineReceived : registerPaymentMode === "split" ? onlineReceived : 0,
				changeReturned: changeReturn > 0 ? changeReturn : 0,
				netBalanceAdded: changeReturn < 0 ? Math.abs(changeReturn) : 0,
				remarks: schemeRemarks,
			});

			queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

			setActiveInvoiceOrder(generatedOrder);

			// Automatically clear entire counter page: cart, customer, search, and amounts become zero
			resetCounter();

			if (action === "print") {
				setIsInvoiceOpen(true);
				showFlashNotice(`Order ${generatedOrder.invoiceNumber} recorded! Counter cleared for next bill.`);
			} else {
				showFlashNotice(`Order ${generatedOrder.invoiceNumber} recorded successfully! Counter cleared for next bill.`);
			}
		} catch (err: any) {
			console.error("Failed to save order to database:", err);
			alert(err.message || "Failed to save order invoice");
		} finally {
			setIsSubmittingOrder(false);
		}
	};

	return (
		<div className="flex flex-col gap-5 w-full max-w-[1600px] mx-auto pb-16">
			{/* TOP BAR: SHADCN BRANCH SELECTOR & LIVE TIMING ONLY */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				{/* Left: Branch Indicator & shadcn Select */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1 min-w-0">
					<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Store className="size-5" />
					</div>
					<div className="space-y-1.5 flex-1 max-w-md">
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Active Shop Counter
							</span>
							<Badge
								variant="outline"
								className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] py-0 px-2 flex items-center gap-1 font-medium"
							>
								<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
								Terminal Online
							</Badge>
						</div>

						{/* shadcn Select for Branch Selection */}
						<Select
							value={activeBranchId}
							onValueChange={(val) => {
								if (val) handleBranchChange(val as BranchId);
							}}
						>
							<SelectTrigger className="h-9 text-xs sm:text-sm font-bold w-full bg-background border-input">
								<SelectValue placeholder="Select Branch Counter..." />
							</SelectTrigger>
							<SelectContent>
								{BRANCHES.map((b) => (
									<SelectItem key={b.id} value={b.id} className="text-xs font-medium">
										{b.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Center: Branch Details snippet */}
				<div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground border-x px-6">
					<div>
						<span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">
							Branch Location
						</span>
						<p className="font-medium text-foreground truncate max-w-xs">
							{currentBranch.address}
						</p>
					</div>
					<div>
						<span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">
							Counter Hotline
						</span>
						<p className="font-medium text-foreground font-mono">{currentBranch.phone}</p>
					</div>
				</div>

				{/* Right: Timing only (Hold bill & New bill removed as requested) */}
				<div className="flex items-center justify-end gap-3 shrink-0">
					<div className="flex items-center gap-2 bg-muted/50 border px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-foreground shadow-2xs">
						<Clock className="size-4 text-primary" />
						<span>{currentTime || "12:00:00 PM"}</span>
					</div>
				</div>
			</div>

			{/* FLASH NOTIFICATION */}
			{successNotice && (
				<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
						<span>{successNotice}</span>
					</div>
					<button
						type="button"
						onClick={() => setSuccessNotice(null)}
						className="text-muted-foreground hover:text-foreground cursor-pointer"
					>
						<X className="size-3.5" />
					</button>
				</div>
			)}

			{/* ERROR / VALIDATION NOTIFICATION */}
			{errorNotice && (
				<div className="rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300 px-4 py-3 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
					<div className="flex items-center gap-2.5">
						<AlertTriangle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
						<span>{errorNotice}</span>
					</div>
					<button
						type="button"
						onClick={() => setErrorNotice(null)}
						className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded hover:bg-rose-500/20"
					>
						<X className="size-3.5" />
					</button>
				</div>
			)}

			{/* MAIN 2-COLUMN COUNTER GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
				{/* LEFT COLUMN: PRODUCT SELECTION & CART TABLE (Col span 7 on large) */}
				<div className="lg:col-span-7 flex flex-col gap-4">
					{/* PRODUCT ENTRY / SEARCH CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
						{/* Header: Title */}
						<div className="flex items-center justify-between border-b pb-3 gap-2">
							<div className="flex items-center gap-2">
								<Layers className="size-4 text-primary" />
								<h2 className="font-heading font-bold text-sm text-foreground">
									Spare Parts Inventory Catalog
								</h2>
							</div>
						</div>

						{/* Bike Model & Filters Row with shadcn Select */}
						<div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
							{/* Bike Model Selector (shadcn Select) */}
							<div className="sm:col-span-6 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
									<Bike className="size-3 text-primary" />
									Target Bike Model:
								</label>
								<Select
									value={selectedBikeModel}
									onValueChange={(val) => {
										if (val) setSelectedBikeModel(val);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full bg-background">
										<SelectValue placeholder="Select Bike Model..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All Models" className="text-xs">
											All Models / Universal
										</SelectItem>
										{BIKE_MODELS.map((model) => (
											<SelectItem key={model} value={model} className="text-xs">
												{model}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Category Filter (shadcn Select) */}
							<div className="sm:col-span-3 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Category:
								</label>
								<Select
									value={selectedCategory}
									onValueChange={(val) => {
										if (val) setSelectedCategory(val);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full bg-background truncate">
										<SelectValue placeholder="Category..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All" className="text-xs">
											All Categories
										</SelectItem>
										<SelectItem value="Engine & Transmission" className="text-xs">
											Engine & Transmission
										</SelectItem>
										<SelectItem value="Electrical & Lighting" className="text-xs">
											Electrical & Lighting
										</SelectItem>
										<SelectItem value="Brakes & Suspension" className="text-xs">
											Brakes & Suspension
										</SelectItem>
										<SelectItem value="Chassis & Body" className="text-xs">
											Chassis & Body
										</SelectItem>
										<SelectItem value="Cables & Control" className="text-xs">
											Cables & Control
										</SelectItem>
										<SelectItem value="Tyres & Wheels" className="text-xs">
											Tyres & Wheels
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Quantity to Add */}
							<div className="sm:col-span-3 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Quantity:
								</label>
								<div className="flex items-center border rounded-lg overflow-hidden bg-background h-9">
									<button
										type="button"
										onClick={() => setInputQuantity((q) => Math.max(1, (q || 1) - 1))}
										className="px-2.5 h-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									>
										<Minus className="size-3" />
									</button>
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={inputQuantity === 0 ? "" : inputQuantity}
										placeholder="1"
										onChange={(e) => {
											const clean = e.target.value.replace(/[^0-9]/g, "");
											setInputQuantity(clean === "" ? 0 : parseInt(clean, 10));
										}}
										onBlur={() => {
											if (!inputQuantity || inputQuantity <= 0) {
												setInputQuantity(1);
											}
										}}
										className="w-full text-center text-xs font-bold text-foreground bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={() => setInputQuantity((q) => (q || 0) + 1)}
										className="px-2.5 h-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									>
										<Plus className="size-3" />
									</button>
								</div>
							</div>
						</div>

						{/* Search Input Bar */}
						<div className="space-y-2">
							<div className="relative">
								{isSearchLoading ? (
									<Loader2 className="size-4 absolute left-3 top-3 text-primary animate-spin" />
								) : (
									<Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
								)}
								<Input
									placeholder="Search spare part name or SKU (e.g. Piston, Clutch Gear, Brake Shoe, Chain)..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 h-10 text-xs font-medium bg-background"
								/>
								{searchQuery && (
									<button
										type="button"
										onClick={() => setSearchQuery("")}
										className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
									>
										<X className="size-4" />
									</button>
								)}
							</div>

							{/* Pricing Tier Selector (Full Width below Search Bar) */}
							<div className="grid grid-cols-2 gap-2 w-full">
								<Button
									type="button"
									variant={selectedPricingTier === "Retail" ? "default" : "outline"}
									onClick={() => handlePricingTierChange("Retail")}
									className="w-full h-8 text-xs font-normal cursor-pointer"
								>
									Retail
								</Button>
								<Button
									type="button"
									variant={selectedPricingTier === "Wholesale" ? "default" : "outline"}
									onClick={() => handlePricingTierChange("Wholesale")}
									className="w-full h-8 text-xs font-normal cursor-pointer"
								>
									Wholesale
								</Button>
							</div>

							{/* Autocomplete / Suggested Products dropdown */}
							{searchQuery.trim().length > 0 && (
								<div className="rounded-xl border bg-popover shadow-lg max-h-72 overflow-y-auto divide-y divide-border">
									{cart.some((ci) => !ci.quantity || ci.quantity <= 0) && (
										<div className="p-2.5 bg-rose-500/10 border-b border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
											<AlertTriangle className="size-4 shrink-0 text-rose-600 animate-pulse" />
											<span>
												Cart mein item ki quantity 0 / empty hai. Naya item add karne se pehle quantity enter karein ya pending item delete karein!
											</span>
										</div>
									)}
									{isSearchLoading ? (
										<div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
											<Loader2 className="size-4 animate-spin text-primary" />
											<span>Searching database catalog for "{searchQuery}"...</span>
										</div>
									) : searchResults.length === 0 ? (
										<div className="p-4 text-center text-xs text-muted-foreground">
											No matching products found in database catalog for "{debouncedSearchQuery || searchQuery}".
										</div>
									) : (
										searchResults.map((prod) => {
											const branchStock = getBranchStock(prod);
											const displayPrice =
												selectedPricingTier === "Retail"
													? Math.round(prod.retailPrice || prod.price * 1.15)
													: prod.price;

											return (
												<div
													key={prod.id}
													className="p-2.5 hover:bg-muted/50 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
													onClick={() => handleAddCatalogItem(prod)}
												>
													<div className="flex items-center gap-3 min-w-0 flex-1">
														{/* Product Thumbnail Image */}
														<div className="size-10 rounded-lg border bg-muted/30 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-2xs">
															<Image
																src={prod.imageUrl || "/logo.png"}
																alt={prod.name}
																width={36}
																height={36}
																className="size-full object-contain"
															/>
														</div>

														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2 flex-wrap">
																<span className="font-semibold text-xs text-foreground truncate">
																	{prod.name}
																</span>
																<Badge variant="secondary" className="text-[10px] py-0 px-1.5 shrink-0">
																	{prod.bikeModel}
																</Badge>
																{prod.tradeScheme && (
																	<Badge
																		className="text-[10px] py-0 px-2 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold shrink-0 animate-pulse"
																	>
																		<Gift className="size-3 text-amber-600" />
																		{prod.tradeScheme.schemeType === "buy_x_get_y"
																			? `Buy ${prod.tradeScheme.buyQuantity} Get ${prod.tradeScheme.freeQuantity} Free`
																			: `Net Scheme Rs. ${prod.tradeScheme.netSchemeRate}`}
																	</Badge>
																)}
															</div>
															<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
																<span>SKU: {prod.sku}</span>
																<span>•</span>
																<span className="text-foreground font-medium">
																	Rs. {displayPrice.toLocaleString()} ({selectedPricingTier})
																</span>
																<span>•</span>
																<span
																	className={`font-semibold ${
																		branchStock > 10
																			? "text-emerald-600 dark:text-emerald-400"
																			: branchStock > 0
																			? "text-amber-600 dark:text-amber-400"
																			: "text-rose-600"
																	}`}
																>
																	{branchStock} {prod.unit} in {currentBranch.shortName}
																</span>
															</div>
														</div>
													</div>

													<Button
														size="sm"
														className={`h-7 px-3 text-xs gap-1 shrink-0 cursor-pointer ${
															cart.some((ci) => !ci.quantity || ci.quantity <= 0)
																? "bg-muted text-muted-foreground border opacity-60 cursor-not-allowed"
																: "bg-primary text-primary-foreground"
														}`}
														disabled={cart.some((ci) => !ci.quantity || ci.quantity <= 0)}
														title={
															cart.some((ci) => !ci.quantity || ci.quantity <= 0)
																? "Please enter quantity for pending cart item before adding more"
																: `Add ${inputQuantity} to cart`
														}
														onClick={(e) => {
															e.stopPropagation();
															handleAddCatalogItem(prod);
														}}
													>
														<Plus className="size-3" />
														Add ({inputQuantity})
													</Button>
												</div>
											);
										})
									)}
								</div>
							)}
						</div>
					</div>

					{/* CART LINE ITEMS TABLE */}
					<div className="rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col">
						{/* Table Header / Action Bar */}
						<div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Receipt className="size-4 text-primary" />
								<h2 className="font-heading font-bold text-sm text-foreground">
									Current Counter Cart
								</h2>
								<Badge variant="secondary" className="text-xs font-mono font-semibold">
									{totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								{schemeEligibleCount > 0 && (
									<Button
										type="button"
										variant="outline"
										size="xs"
										onClick={() => setIsNetSchemeModalOpen(true)}
										className={`h-7 text-xs font-bold gap-1 cursor-pointer transition-all ${
											allNetSchemeActive
												? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
												: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
										}`}
										title="Switch entire cart between Net Scheme (Cash Discount, 0 Free) and Normal Scheme (10+1 Free Pieces)"
									>
										<Zap className="size-3 fill-amber-500 text-amber-500" />
										{allNetSchemeActive ? "Revert All to Normal Scheme" : "⚡ Apply Net Scheme to All"}
									</Button>
								)}
								<span className="text-xs text-muted-foreground hidden sm:inline">
									Branch Stock:{" "}
									<strong className="text-foreground">{currentBranch.shortName}</strong>
								</span>
								<Button
									variant="outline"
									size="xs"
									onClick={handleNewSale}
									className="text-xs h-7 gap-1 border-dashed hover:bg-muted cursor-pointer"
									title="Clear all inputs and start a fresh bill"
								>
									<RotateCcw className="size-3" />
									New Sale
								</Button>
								<Button
									variant="ghost"
									size="xs"
									onClick={clearCart}
									disabled={cart.length === 0}
									className="text-muted-foreground hover:text-rose-600 cursor-pointer h-7 text-xs"
								>
									Clear Table
								</Button>
							</div>
						</div>

						{/* Items Table */}
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
									<tr>
										<th className="py-2.5 px-3 w-10 text-center">#</th>
										<th className="py-2.5 px-3 min-w-[200px]">Product & Bike Model</th>
										<th className="py-2.5 px-3 min-w-[100px]">Type / Rate</th>
										<th className="py-2.5 px-3 min-w-[120px] text-center">Qty</th>
										<th className="py-2.5 px-3 min-w-[90px] text-right">Total (PKR)</th>
										<th className="py-2.5 px-3 w-10 text-center"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{cart.length === 0 ? (
										<tr>
											<td colSpan={6} className="py-12 text-center text-muted-foreground space-y-2">
												<Receipt className="size-8 mx-auto opacity-30" />
												<p className="text-xs font-medium">Cart is currently empty.</p>
												<p className="text-[11px] text-muted-foreground">
													Search spare parts above and add them to create customer bill.
												</p>
											</td>
										</tr>
									) : (
										cart.map((item, index) => {
											const lineTotal = item.rate * item.quantity;
											const isLowBranchStock =
												item.branchStock > 0 && item.quantity > item.branchStock;
											const schemeInfo = calculateItemScheme(item);

											return (
												<tr key={item.id} className="hover:bg-muted/30 transition-colors">
													<td className="py-2.5 px-3 text-center font-mono text-muted-foreground align-middle">
														{index + 1}
													</td>

													{/* Product Name, Thumbnail & Model selection */}
													<td className="py-2.5 px-3 align-middle">
														<div className="flex items-center gap-2.5">
															{/* Visual Part Thumbnail Image */}
															<div className="size-9 rounded-lg border bg-muted/30 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
																<Image
																	src={item.imageUrl || "/logo.png"}
																	alt={item.name}
																	width={32}
																	height={32}
																	className="size-full object-contain"
																/>
															</div>

															<div className="min-w-0 flex-1">
																<div className="font-semibold text-foreground text-xs leading-snug truncate max-w-[280px] sm:max-w-md">
																	{item.name}
																</div>
																<div className="flex items-center flex-wrap gap-1.5 mt-1">
																	{/* Model Dropdown */}
																	<select
																		value={item.bikeModel}
																		onChange={(e) => updateItemModel(item.id, e.target.value)}
																		className="text-[10px] font-semibold bg-muted/60 hover:bg-muted rounded px-1.5 py-0.5 border text-foreground focus:outline-none cursor-pointer"
																	>
																		{BIKE_MODELS.map((m) => (
																			<option key={m} value={m}>
																				{m}
																			</option>
																		))}
																	</select>

																	{/* Scheme Active / Disabled Check & Cross Toggle */}
																	{item.tradeScheme && (
																		<button
																			type="button"
																			onClick={() => toggleSchemeDisabled(item.id)}
																			className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
																				item.isSchemeDisabled
																					? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
																					: "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300"
																			}`}
																			title={
																				item.isSchemeDisabled
																					? "Scheme is OFF: Selling at standard rate with 0 free pieces. Click to turn ON scheme."
																					: "Scheme is ON. Click to turn OFF scheme (sell at standard rate with 0 free pieces)."
																			}
																		>
																			{item.isSchemeDisabled ? (
																				<>
																					<X className="size-2.5 text-rose-600 stroke-[3]" />
																					<span>Scheme Off</span>
																				</>
																			) : (
																				<>
																					<Check className="size-2.5 text-emerald-600 stroke-[3]" />
																					<span>Scheme On</span>
																				</>
																			)}
																		</button>
																	)}

																	{/* Scheme Disabled Badge info */}
																	{item.tradeScheme && item.isSchemeDisabled && (
																		<Badge
																			variant="secondary"
																			className="text-[9.5px] py-0 px-1.5 font-medium text-muted-foreground bg-muted/60 border border-muted"
																			title="This item is billed at normal rate without any scheme or free units"
																		>
																			Standard Rate • 0 Free
																		</Badge>
																	)}

																	{/* Short Scheme Badge: e.g. "10 + 1 Free" or "Net Scheme" */}
																	{!item.isSchemeDisabled && schemeInfo.hasScheme && (
																		item.isSchemeActive ? (
																			<Badge
																				variant="outline"
																				className="text-[10px] py-0 px-1.5 font-bold border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200 flex items-center gap-1 shadow-2xs"
																				title="Net Scheme Active: Cash discount applied, 0 free items given"
																			>
																				<Zap className="size-2.5 fill-amber-500 text-amber-500" />
																				Net Scheme (Rs. {schemeInfo.effectiveRate}/pc • 0 Free)
																			</Badge>
																		) : (
																			<Badge
																				variant="outline"
																				className="text-[10px] py-0 px-1.5 font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shadow-2xs"
																				title={schemeInfo.title}
																			>
																				<Gift className="size-2.5 text-emerald-600" />
																				{schemeInfo.shortLabel}
																			</Badge>
																		)
																	)}

																	{/* Free Bonus Earned Badge - e.g. "+2 Free (28 total)" (Only in Normal Scheme) */}
																	{!item.isSchemeDisabled && !item.isSchemeActive && schemeInfo.hasScheme && schemeInfo.freeUnits > 0 && (
																		<Badge
																			className="text-[10px] py-0 px-1.5 font-black bg-emerald-600 text-white font-mono shadow-2xs flex items-center gap-0.5"
																			title={`Total ${schemeInfo.totalDeliveredUnits} units delivered (${item.quantity} billed + ${schemeInfo.freeUnits} free)`}
																		>
																			+{schemeInfo.freeUnits} Free ({schemeInfo.totalDeliveredUnits} Total)
																		</Badge>
																	)}

																	{/* Wholesale Net Scheme Button */}
																	{!item.isSchemeDisabled && item.tradeScheme && (
																		<button
																			type="button"
																			onClick={() => toggleNetScheme(item.id)}
																			className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
																				item.isSchemeActive
																					? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-black shadow-2xs"
																					: "bg-muted/40 hover:bg-muted text-muted-foreground border-border hover:border-amber-400"
																			}`}
																			title={
																				item.isSchemeActive
																					? "Currently Net Scheme (Cash Discount, 0 Free). Click to revert to Normal 10+1 Free."
																					: "Convert to Net Scheme: Rates discounted according to Rate * 10 / 11, Free bonus set to 0."
																			}
																		>
																			<Zap
																				className={`size-2.5 ${
																					item.isSchemeActive
																						? "fill-amber-500 text-amber-500"
																						: ""
																				}`}
																			/>
																			{item.isSchemeActive ? "⚡ Net Scheme" : "Net Scheme"}
																		</button>
																	)}

																	{isLowBranchStock && (
																		<Badge
																			variant="destructive"
																			className="text-[9px] py-0 px-1 font-normal flex items-center gap-0.5"
																			title={`Branch has ${item.branchStock} in stock`}
																		>
																			<AlertTriangle className="size-2.5" />
																			Low Stock ({item.branchStock})
																		</Badge>
																	)}
																</div>
															</div>
														</div>
													</td>

													{/* Price and Rate Edit */}
													<td className="py-2.5 px-3 align-middle">
														<div className="flex items-center gap-1">
															<span className="text-[10px] text-muted-foreground">Rs.</span>
															<input
																type="number"
																value={item.rate}
																onChange={(e) =>
																	updateItemRate(item.id, parseInt(e.target.value) || 0)
																}
																className={`w-16 h-7 px-1.5 font-mono font-bold text-xs rounded border text-right focus:outline-none focus:ring-1 focus:ring-primary ${
																	item.isSchemeActive
																		? "bg-amber-500/10 border-amber-500/60 text-amber-900 dark:text-amber-200 font-black"
																		: "bg-background text-foreground"
																}`}
															/>
														</div>
														<span className="text-[10px] text-muted-foreground block mt-0.5 whitespace-nowrap">
															{item.isSchemeActive ? "⚡ Net Rate" : `${item.pricingTier} Rate`}
														</span>
													</td>

													{/* Quantity +/- controls with DIRECT NUMERIC INPUT */}
													<td className="py-2.5 px-3 text-center align-middle">
														<div
															className={`inline-flex items-center border rounded-lg overflow-hidden bg-background h-7 shadow-2xs transition-colors ${
																!item.quantity || item.quantity <= 0
																	? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20"
																	: ""
															}`}
														>
															<button
																type="button"
																onClick={() => updateQuantity(item.id, -1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															>
																<Minus className="size-3" />
															</button>
															<input
																type="text"
																inputMode="numeric"
																pattern="[0-9]*"
																value={item.quantity === 0 ? "" : item.quantity}
																placeholder="0"
																onChange={(e) => {
																	const clean = e.target.value.replace(/[^0-9]/g, "");
																	setDirectQuantity(item.id, clean === "" ? 0 : parseInt(clean, 10));
																}}
																className={`w-12 h-full text-center font-mono font-bold text-xs bg-transparent border-0 outline-none p-0 focus:bg-muted/20 ${
																	!item.quantity || item.quantity <= 0
																		? "text-rose-600 font-extrabold placeholder:text-rose-400"
																		: "text-foreground"
																}`}
															/>
															<button
																type="button"
																onClick={() => updateQuantity(item.id, 1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															>
																<Plus className="size-3" />
															</button>
														</div>
														{!item.quantity || item.quantity <= 0 ? (
															<span className="text-[10px] text-rose-600 font-bold block mt-0.5 animate-pulse">
																Enter Qty
															</span>
														) : (
															<span className="text-[10px] text-muted-foreground block mt-0.5">
																{item.unit}
															</span>
														)}
													</td>

													{/* Line Total */}
													<td className="py-2.5 px-3 text-right font-mono font-bold text-foreground align-middle">
														Rs. {lineTotal.toLocaleString()}
													</td>

													{/* Delete action */}
													<td className="py-2.5 px-3 text-center align-middle">
														<button
															type="button"
															onClick={() => removeItem(item.id)}
															className="text-muted-foreground hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
															title="Remove item"
														>
															<Trash2 className="size-3.5" />
														</button>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Subtotal Footer inside table */}
						{cart.length > 0 && (
							<div className="p-3 border-t bg-muted/10 flex items-center justify-between text-xs font-semibold px-4">
								<span className="text-muted-foreground">
									Total Spare Parts: {cart.length} lines ({totalItemsCount} units)
								</span>
								<span className="text-foreground font-mono">
									Gross Subtotal: Rs. {subtotal.toLocaleString()}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* RIGHT COLUMN: CUSTOMER DETAILS, CASH REGISTER & INVOICING (Col span 5 on large) */}
				<div className="lg:col-span-5 flex flex-col gap-4">
					{/* CUSTOMER PROFILE CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<div className="flex items-center justify-between border-b pb-2.5">
							<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
								<User className="size-4 text-primary" />
								Customer Information
							</h3>
							<div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
								<button
									type="button"
									onClick={() => {
										setCustomer({ ...customer, type: "Retail Customer" });
										setSelectedPricingTier("Retail");
									}}
									className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
										customer.type === "Retail Customer"
											? "bg-background text-foreground shadow-2xs font-bold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Retail
								</button>
								<button
									type="button"
									onClick={() => {
										setCustomer({ ...customer, type: "Wholesale Dealer" });
										setSelectedPricingTier("Wholesale");
									}}
									className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
										customer.type === "Wholesale Dealer"
											? "bg-background text-foreground shadow-2xs font-bold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Wholesale
								</button>
							</div>
						</div>

						{/* Customer Quick Selector Dropdown & Details */}
						<div className="space-y-3 pt-1">
							<div className="space-y-1">
								<div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
									<span>Select Registered Khata Customer:</span>
									<Link
										href="/dashboard/ledger"
										className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
									>
										Open Ledgers <ArrowRight className="size-2.5" />
									</Link>
								</div>
								<CustomerSearchSelect
									selectedCustomerId={customer.id}
									onSelectCustomer={handleSelectCustomer}
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Customer / Shop Name:
									</label>
									<Input
										value={customer.name}
										onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="e.g. Walk-in Customer"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Contact Phone:
									</label>
									<Input
										value={customer.phone}
										onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="0333-1285556"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										City / Market:
									</label>
									<Input
										value={customer.city}
										onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="Karachi"
									/>
								</div>

								{/* Payment Terms with shadcn Select */}
								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Payment Terms:
									</label>
									<Select
										value={
											registerPaymentMode === "online"
												? "Online Transfer"
												: registerPaymentMode === "credit"
												? "Credit / Khata"
												: customer.paymentMethod
										}
										onValueChange={(val) => {
											if (val) {
												setCustomer({
													...customer,
													paymentMethod: val as CustomerProfile["paymentMethod"],
												});
												if (val === "Credit / Khata") {
													setRegisterPaymentMode("credit");
												} else if (val === "Online Transfer") {
													setRegisterPaymentMode("online");
												} else {
													setRegisterPaymentMode("cash");
												}
											}
										}}
									>
										<SelectTrigger className="h-8 text-xs w-full bg-background font-semibold">
											<SelectValue placeholder="Payment Mode..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Cash on Counter" className="text-xs">
												Cash on Counter
											</SelectItem>
											<SelectItem value="Online Transfer" className="text-xs">
												Online Transfer (EasyPaisa/JazzCash/Bank)
											</SelectItem>
											<SelectItem value="Credit / Khata" className="text-xs">
												Credit / Khata Ledger
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Live Customer Khata Alert (Video 1 & 2 Request) */}
							{customer.currentBalance !== undefined && customer.currentBalance > 0 && (
								<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs space-y-1.5 animate-in fade-in">
									<div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
										<span className="flex items-center gap-1.5">
											<CreditCard className="size-3.5 text-amber-600" />
											Previous Khata Balance:
										</span>
										<span className="font-mono text-sm font-black">
											Rs. {customer.currentBalance.toLocaleString()}
										</span>
									</div>
									<div className="text-[11px] text-amber-900/80 dark:text-amber-300/80 flex items-center justify-between">
										<span>Route: {customer.route || "Saddar"} ({customer.salesman || "Tariq Mehmood"})</span>
										<Link
											href={`/dashboard/ledger?customer=${encodeURIComponent(customer.name)}`}
											className="underline font-bold text-primary hover:text-primary/80"
										>
											View Statement
										</Link>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* TRADE SCHEME & FREE BONUS SUMMARY CARD (Right Side) */}
					{cartSchemesSummary.hasAnyScheme && (
						<div className="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in">
							<div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
								<div className="flex items-center gap-2">
									<div className="size-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
										<Gift className="size-4" />
									</div>
									<div>
										<h4 className="font-heading font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
											Trade Schemes & Bonus Units
										</h4>
										<span className="text-[10px] text-muted-foreground block">
											Live promotional margin & free spare parts
										</span>
									</div>
								</div>
								{cartSchemesSummary.totalFreeUnits > 0 ? (
									<Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold px-2 py-0.5 animate-pulse shadow-2xs">
										+{cartSchemesSummary.totalFreeUnits} Free Pcs
									</Badge>
								) : (
									<Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-500/40">
										Scheme Active
									</Badge>
								)}
							</div>

							<div className="space-y-2">
								{cartSchemesSummary.activeSchemeItems.map((sch, i) => (
									<div
										key={sch.id || i}
										className="rounded-xl border bg-background/90 p-2.5 text-xs space-y-1 shadow-2xs"
									>
										<div className="flex items-start justify-between gap-2">
											<span className="font-semibold text-foreground truncate">{sch.name}</span>
											{sch.freeUnits > 0 ? (
												<span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs shrink-0">
													+{sch.freeUnits} FREE {sch.unit}
												</span>
											) : (
												<span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
													Add {sch.nextFreeAt} for +1 Free
												</span>
											)}
										</div>
										<div className="flex items-center justify-between text-[11px] text-muted-foreground">
											<span className="font-bold text-amber-700 dark:text-amber-300 text-[11px]">{sch.shortLabel}</span>
											{sch.freeUnits > 0 ? (
												<span className="font-medium text-foreground text-[10.5px]">
													Total: <strong>{sch.totalDelivered} {sch.unit}</strong> ({sch.quantity} Paid + {sch.freeUnits} Free)
												</span>
											) : (
												<span className="text-[10.5px]">
													Purchasing {sch.quantity} {sch.unit}
												</span>
											)}
										</div>
									</div>
								))}
							</div>

							{cartSchemesSummary.totalFreeUnits > 0 && (
								<div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-200">
									<span className="flex items-center gap-1.5">
										<Sparkles className="size-3.5 text-amber-600" /> Total Free Units Dispatched:
									</span>
									<span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black">
										+{cartSchemesSummary.totalFreeUnits} Free Units
									</span>
								</div>
							)}
						</div>
					)}

					{/* BILL CALCULATION & CASH REGISTER CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
						<div className="flex items-center justify-between border-b pb-2.5">
							<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
								<Calculator className="size-4 text-primary" />
								Bill Calculation & Cash Register
							</h3>
							<span className="text-xs font-mono text-muted-foreground">PKR (Rs.)</span>
						</div>

						{/* Breakdown rows */}
						<div className="space-y-2 text-xs">
							<div className="flex items-center justify-between py-1 border-b border-border/40">
								<span className="text-muted-foreground">Gross Items Subtotal:</span>
								<span className="font-mono font-semibold text-foreground">
									Rs. {subtotal.toLocaleString()}
								</span>
							</div>

							<div className="py-1.5 border-b border-border/40 space-y-1">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<span className="text-muted-foreground font-medium">Counter Discount:</span>
										<div className="inline-flex items-center bg-muted/80 p-0.5 rounded-md border border-border/60">
											<button
												type="button"
												onClick={handleSwitchDiscountToFixed}
												className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
													discountMode === "fixed"
														? "bg-background text-foreground shadow-2xs font-black"
														: "text-muted-foreground hover:text-foreground"
												}`}
												title="Fixed Rupee Discount"
											>
												Rs.
											</button>
											<button
												type="button"
												onClick={handleSwitchDiscountToPercent}
												className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
													discountMode === "percent"
														? "bg-primary text-primary-foreground shadow-2xs font-black"
														: "text-muted-foreground hover:text-foreground"
												}`}
												title="Percentage Discount (e.g. 5%)"
											>
												%
											</button>
										</div>
									</div>

									<div className="flex items-center gap-1">
										<span className="text-rose-600 font-bold text-xs">
											{discountMode === "percent" ? "- %" : "- Rs."}
										</span>
										<div className="relative">
											<input
												type="text"
												value={discountInput}
												onChange={(e) => handleDiscountInputChange(e.target.value)}
												placeholder={discountMode === "percent" ? "5" : "100"}
												className="w-20 h-7 px-1.5 pr-6 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
											/>
											<span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground pointer-events-none">
												{discountMode === "percent" ? "%" : "PKR"}
											</span>
										</div>
									</div>
								</div>

								{/* Computed Rupee Deduction Helper under input */}
								{(discountValue > 0 || (discountMode === "percent" && parseFloat(discountInput) > 0)) && (
									<div className="flex items-center justify-end text-[10px]">
										{discountMode === "percent" ? (
											<span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
												= Rs. {discountValue.toLocaleString()} deduction ({parseFloat(discountInput) || 0}%)
											</span>
										) : (
											<span className="text-muted-foreground font-mono">
												{subtotal > 0
													? `~${((discountValue / subtotal) * 100).toFixed(1)}% of subtotal`
													: "Flat cash discount"}
											</span>
										)}
									</div>
								)}
							</div>

							<div className="flex items-center justify-between py-1 border-b border-border/40">
								<span className="text-muted-foreground">Fitting / Packing / Delivery:</span>
								<div className="flex items-center gap-1">
									<span className="text-foreground font-medium">+ Rs.</span>
									<input
										type="number"
										min={0}
										value={shippingOrFitting}
										onChange={(e) =>
											setShippingOrFitting(Math.max(0, parseInt(e.target.value) || 0))
										}
										className="w-20 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
									/>
								</div>
							</div>

							{cartSchemesSummary.totalFreeUnits > 0 && (
								<div className="flex items-center justify-between py-1 border-b border-border/40 text-emerald-700 dark:text-emerald-400 font-semibold">
									<span className="flex items-center gap-1">
										<Gift className="size-3.5" /> Free Promotional Bonus Items:
									</span>
									<span className="font-mono font-bold">
										+{cartSchemesSummary.totalFreeUnits} Pcs (Complimentary)
									</span>
								</div>
							)}

							{cartSchemesSummary.totalSchemeSavings > 0 && (
								<div className="flex items-center justify-between py-1 border-b border-border/40 text-emerald-700 dark:text-emerald-400 text-[11px]">
									<span>Scheme Margin Benefit:</span>
									<span className="font-mono font-bold">
										Rs. {cartSchemesSummary.totalSchemeSavings.toLocaleString()} (Saved)
									</span>
								</div>
							)}

							{/* NET TOTAL DISPLAY */}
							<div className="rounded-xl bg-primary/10 border-2 border-primary/30 p-3.5 flex items-center justify-between">
								<div>
									<span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
										Net Payable Bill
									</span>
									<span className="text-[10px] text-muted-foreground">
										Inclusive of warranty & taxes
									</span>
								</div>
								<div className="text-right">
									<span className="font-heading font-black text-2xl sm:text-3xl text-foreground font-mono">
										Rs. {netBill.toLocaleString()}
									</span>
								</div>
							</div>

							{/* PAYMENT TENDER METHOD SELECTOR */}
							<div className="pt-2 space-y-2">
								<div className="flex items-center justify-between">
									<label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
										<Banknote className="size-3.5 text-primary" />
										<span>Payment Method:</span>
									</label>
									{paymentSlipUrl && (
										<span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
											<CheckCircle2 className="size-3" /> Slip Attached
										</span>
									)}
								</div>

								{/* 4 Mode Buttons */}
								<div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl border">
									<button
										type="button"
										onClick={() => {
											setRegisterPaymentMode("cash");
											setCashReceived(netBill);
											setOnlineReceived(0);
										}}
										className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
											registerPaymentMode === "cash"
												? "bg-background text-foreground shadow-2xs border"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Banknote className="size-3.5 text-emerald-600 shrink-0" />
										<span>Cash</span>
									</button>

									<button
										type="button"
										onClick={() => {
											setRegisterPaymentMode("online");
											setCashReceived(0);
											setOnlineReceived(netBill);
										}}
										className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
											registerPaymentMode === "online"
												? "bg-background text-sky-600 dark:text-sky-400 shadow-2xs border border-sky-500/30"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Smartphone className="size-3.5 text-sky-600 shrink-0" />
										<span>Online</span>
									</button>

									<button
										type="button"
										onClick={() => {
											setRegisterPaymentMode("split");
											const half = Math.round(netBill / 2);
											setCashReceived(half);
											setOnlineReceived(netBill - half);
										}}
										className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
											registerPaymentMode === "split"
												? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs border border-amber-500/30"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<CreditCard className="size-3.5 text-amber-600 shrink-0" />
										<span>Split</span>
									</button>

									<button
										type="button"
										onClick={() => {
											setRegisterPaymentMode("credit");
											setCashReceived(0);
											setOnlineReceived(0);
										}}
										className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
											registerPaymentMode === "credit"
												? "bg-background text-rose-600 dark:text-rose-400 shadow-2xs border border-rose-500/30"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<FileText className="size-3.5 text-rose-600 shrink-0" />
										<span>Khata</span>
									</button>
								</div>
							</div>

							{/* DYNAMIC TENDER INPUTS BASED ON PAYMENT MODE */}
							<div className="space-y-2.5">
								{/* 1. CASH ONLY */}
								{registerPaymentMode === "cash" && (
									<div className="flex items-center justify-between">
										<label className="text-xs font-bold text-foreground flex items-center gap-1">
											<Banknote className="size-4 text-emerald-600" />
											Cash Tender / Received:
										</label>
										<div className="flex items-center gap-1">
											<span className="text-xs font-bold text-muted-foreground">Rs.</span>
											<input
												type="number"
												min={0}
												value={cashReceived}
												onChange={(e) =>
													setCashReceived(Math.max(0, parseInt(e.target.value) || 0))
												}
												className="w-28 h-8 px-2 font-mono font-black text-sm rounded-lg border-2 border-emerald-500/50 bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
											/>
										</div>
									</div>
								)}

								{/* 2. ONLINE ONLY */}
								{registerPaymentMode === "online" && (
									<div className="flex items-center justify-between">
										<div>
											<label className="text-xs font-bold text-foreground flex items-center gap-1">
												<Smartphone className="size-4 text-sky-600" />
												Online Received (Bank / Raast):
											</label>
											<span className="text-[10px] text-muted-foreground block">
												EasyPaisa, JazzCash, Meezan, HBL
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="text-xs font-bold text-muted-foreground">Rs.</span>
											<input
												type="number"
												min={0}
												value={onlineReceived}
												onChange={(e) =>
													setOnlineReceived(Math.max(0, parseInt(e.target.value) || 0))
												}
												className="w-28 h-8 px-2 font-mono font-black text-sm rounded-lg border-2 border-sky-500/50 bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
											/>
										</div>
									</div>
								)}

								{/* 3. SPLIT (CASH + ONLINE) */}
								{registerPaymentMode === "split" && (
									<div className="space-y-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
										<div className="flex items-center justify-between">
											<label className="text-xs font-semibold text-foreground flex items-center gap-1">
												<Banknote className="size-3.5 text-emerald-600" />
												Cash Paid:
											</label>
											<div className="flex items-center gap-1">
												<span className="text-xs text-muted-foreground">Rs.</span>
												<input
													type="number"
													min={0}
													value={cashReceived}
													onChange={(e) =>
														setCashReceived(Math.max(0, parseInt(e.target.value) || 0))
													}
													className="w-24 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
										</div>

										<div className="flex items-center justify-between">
											<label className="text-xs font-semibold text-foreground flex items-center gap-1">
												<Smartphone className="size-3.5 text-sky-600" />
												Online Transfer:
											</label>
											<div className="flex items-center gap-1">
												<span className="text-xs text-muted-foreground">Rs.</span>
												<input
													type="number"
													min={0}
													value={onlineReceived}
													onChange={(e) =>
														setOnlineReceived(Math.max(0, parseInt(e.target.value) || 0))
													}
													className="w-24 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
										</div>
									</div>
								)}

								{/* 4. ON CREDIT / KHATA */}
								{registerPaymentMode === "credit" && (
									<div className="rounded-xl p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 text-xs flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<FileText className="size-4 text-rose-600 shrink-0" />
											<span>Bill Posts to Khata Ledger:</span>
										</div>
										<span className="font-mono font-black text-sm">
											Rs. {netBill.toLocaleString()}
										</span>
									</div>
								)}

								{/* WHATSAPP PAYMENT SLIP ATTACHMENT BOX */}
								<div className="pt-1">
									<input
										type="file"
										ref={fileInputRef}
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handleUploadSlipFile(file);
											e.target.value = "";
										}}
									/>

									{paymentSlipUrl ? (
										<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
											<div className="flex items-center gap-2.5 overflow-hidden">
												<div
													onClick={() => setPreviewSlipModalOpen(true)}
													className="relative size-11 rounded-lg border border-emerald-500/30 overflow-hidden shrink-0 bg-muted cursor-pointer group"
													title="Click to enlarge slip"
												>
													<img
														src={paymentSlipUrl}
														alt="WhatsApp Payment Slip"
														className="size-full object-cover group-hover:scale-105 transition-transform"
													/>
													<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
														<Eye className="size-3.5 text-white" />
													</div>
												</div>
												<div className="min-w-0">
													<div className="flex items-center gap-1.5">
														<Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 font-bold">
															Verified Slip
														</Badge>
														<span className="text-[11px] font-bold text-foreground truncate">
															WhatsApp Receipt Attached
														</span>
													</div>
													<span className="text-[10px] text-muted-foreground block truncate">
														Saved to Vercel Blob • Attached to Bill
													</span>
												</div>
											</div>
											<div className="flex items-center gap-1 shrink-0">
												<Button
													type="button"
													size="icon"
													variant="ghost"
													onClick={() => setPreviewSlipModalOpen(true)}
													className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
													title="Enlarge Slip"
												>
													<Eye className="size-3.5" />
												</Button>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													onClick={() => setPaymentSlipUrl(null)}
													className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
													title="Remove Slip"
												>
													<Trash2 className="size-3.5" />
												</Button>
											</div>
										</div>
									) : (
										<div
											onClick={() => fileInputRef.current?.click()}
											className={`rounded-xl border-2 border-dashed p-3 text-center transition-all cursor-pointer group ${
												registerPaymentMode === "online" || registerPaymentMode === "split"
													? "border-sky-400 bg-sky-500/10 hover:bg-sky-500/15"
													: "border-muted-foreground/30 bg-muted/20 hover:bg-muted/40"
											}`}
										>
											{isUploadingSlip ? (
												<div className="flex items-center justify-center gap-2 py-1 text-sky-600">
													<Loader2 className="size-4 animate-spin" />
													<span className="text-xs font-semibold">Uploading to Vercel Blob...</span>
												</div>
											) : (
												<div className="space-y-1">
													<div className="flex items-center justify-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
														<Plus className="size-3.5 text-sky-600" />
														<span>Attach WhatsApp Payment Slip</span>
														<span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">
															Ctrl + V
														</span>
													</div>
													<p className="text-[10px] text-muted-foreground">
														Click to browse or press <strong>Ctrl+V</strong> to paste copied screenshot from WhatsApp
													</p>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Return Balance or Due */}
								<div
									className={`rounded-xl p-3 border flex items-center justify-between ${
										changeReturn >= 0
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
											: "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
									}`}
								>
									<div>
										<span className="text-xs font-bold block">
											{changeReturn >= 0 ? "Change Due (Return to Customer):" : "Remaining Bill Due (Credit):"}
										</span>
										<span className="text-[10px] opacity-80">
											{changeReturn >= 0 ? "Hand over change" : "Will post to Khata balance"}
										</span>
									</div>
									<span className="font-mono font-black text-xl">
										Rs. {Math.abs(changeReturn).toLocaleString()}
									</span>
								</div>

								{/* Running Customer Khata Total (Previous Dues + Unpaid Current Bill) */}
								{customer.id && customer.id !== "walkin" && ((customer.currentBalance || 0) > 0 || changeReturn < 0) && (
									<div className="rounded-xl p-3 bg-neutral-900 text-white dark:bg-neutral-800/90 space-y-1.5 text-xs border border-neutral-700/60 shadow-xs">
										<div className="flex items-center justify-between">
											<div>
												<span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider block">
													Net Cumulative Khata Dues
												</span>
												<span className="text-[11px] text-neutral-300">
													Previous Rs. {(customer.currentBalance || 0).toLocaleString()} {changeReturn < 0 ? `+ Rs. ${Math.abs(changeReturn).toLocaleString()}` : ""}
												</span>
											</div>
											<span className="font-mono font-black text-amber-400 text-base">
												Rs. {((customer.currentBalance || 0) + (changeReturn < 0 ? Math.abs(changeReturn) : 0)).toLocaleString()}
											</span>
										</div>
										{customer.creditLimit && ((customer.currentBalance || 0) + (changeReturn < 0 ? Math.abs(changeReturn) : 0)) > customer.creditLimit && (
											<div className="text-[10px] text-rose-300 font-semibold bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 flex items-center justify-between">
												<span>⚠️ Exceeds Assigned Credit Limit</span>
												<span>Limit: Rs. {customer.creditLimit.toLocaleString()}</span>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* INVOICE ACTION BUTTON */}
						<div className="pt-2 border-t space-y-2">
							{cart.some((it) => !it.quantity || it.quantity <= 0) && (
								<div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
									<AlertTriangle className="size-4 shrink-0 text-rose-600" />
									<span>
										<strong>{cart.filter((it) => !it.quantity || it.quantity <= 0).length} item(s)</strong> have empty or 0 quantity. Enter a valid quantity or delete the item.
									</span>
								</div>
							)}
							<Button
								onClick={() => handleCreateInvoice("print")}
								disabled={cart.length === 0 || isSubmittingOrder}
								className="w-full h-10 gap-2 cursor-pointer font-normal"
							>
								{isSubmittingOrder ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										<span>Saving and Printing...</span>
									</>
								) : (
									<>
										<Printer className="size-4" />
										<span>Save and Print</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* THERMAL / A4 INVOICE PREVIEW MODAL */}
			<InvoiceSheet
				order={activeInvoiceOrder}
				isOpen={isInvoiceOpen}
				onClose={() => setIsInvoiceOpen(false)}
			/>

			{/* MASTER NET SCHEME CONFIRMATION MODAL */}
			{isNetSchemeModalOpen && (
				<div
					className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
					onClick={() => setIsNetSchemeModalOpen(false)}
				>
					<div
						className="bg-card border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-5 space-y-4">
							<div className="flex items-center gap-3">
								<div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
									<Zap className="size-6 fill-amber-500 text-amber-500" />
								</div>
								<div>
									<h3 className="font-heading font-bold text-base text-foreground">
										{allNetSchemeActive
											? "Revert Cart to Normal Scheme?"
											: "Apply Net Scheme to Entire Cart?"}
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										{allNetSchemeActive
											? "Standard wholesale rates & physical 10+1 free items will be restored."
											: `Convert all ${schemeEligibleCount} eligible trade scheme items to discounted Net Rate.`}
									</p>
								</div>
							</div>

							<div className="rounded-xl border bg-muted/40 p-3.5 space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Eligible Products in Cart:</span>
									<span className="font-mono font-bold text-foreground">
										{schemeEligibleCount} items
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Current Billing Mode:</span>
									<span className="font-bold text-amber-600 dark:text-amber-400">
										{allNetSchemeActive
											? "Net Scheme (Cash Discount, 0 Free)"
											: "Normal Scheme (10+1 Physical Free)"}
									</span>
								</div>
								<div className="border-t pt-2 text-[11px] text-muted-foreground leading-relaxed">
									{allNetSchemeActive ? (
										<span>
											Normal scheme restore karne par rate standard wholesale ban jayega aur customer ko physical free bonus items deliver honge.
										</span>
									) : (
										<span>
											<strong>Net Scheme Rule:</strong> Har scheme product ka rate formula <code>Wholesale Rate × 10 / 11</code> ke mutabiq discounted net rate ban jayega, aur <strong>Free bonus items 0 ho jayeingay</strong> (jaise previous software mein hota tha).
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center justify-end gap-2 pt-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setIsNetSchemeModalOpen(false)}
									className="cursor-pointer"
								>
									Cancel
								</Button>
								<Button
									type="button"
									size="sm"
									onClick={() => handleApplyAllNetScheme(!allNetSchemeActive)}
									className={`font-bold cursor-pointer gap-1.5 ${
										allNetSchemeActive
											? "bg-primary text-primary-foreground"
											: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
									}`}
								>
									<Zap className="size-3.5 fill-current" />
									{allNetSchemeActive
										? "Yes, Revert to Normal Scheme"
										: "Yes, Apply Net Scheme (0 Free)"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* FULL ENLARGED WHATSAPP SLIP MODAL */}
			{previewSlipModalOpen && paymentSlipUrl && (
				<div
					className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
					onClick={() => setPreviewSlipModalOpen(false)}
				>
					<div
						className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
							<div className="flex items-center gap-2">
								<Paperclip className="size-4 text-sky-600" />
								<h3 className="font-heading font-bold text-xs text-foreground">
									WhatsApp Payment Proof Screenshot
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setPreviewSlipModalOpen(false)}
								className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md"
							>
								<X className="size-4" />
							</button>
						</div>
						<div className="p-3 overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/40">
							<img
								src={paymentSlipUrl}
								alt="WhatsApp Payment Proof"
								className="max-h-[65vh] w-auto rounded-lg object-contain shadow-sm border"
							/>
						</div>
						<div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between text-xs">
							<span className="text-[11px] text-muted-foreground">
								Uploaded via Vercel Blob Storage
							</span>
							<a
								href={paymentSlipUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
							>
								<span>Open Original File</span>
								<ExternalLink className="size-3" />
							</a>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
