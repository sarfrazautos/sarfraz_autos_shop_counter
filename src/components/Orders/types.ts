export type OrderType = "Wholesale" | "Retail" | "Both";

export type OrderStatus = "Completed" | "Pending" | "In-Progress" | "Cancelled";

export interface OrderItem {
	name: string;
	subLabel?: string; // e.g. "STANDARD" or "70CC"
	quantity: number;
	rate: number;
	total: number;
}

export interface OrderRecord {
	id: string; // e.g. "#SA-56143"
	invoiceNumber: string; // e.g. "SA-64276"
	customerName: string; // e.g. "Afraz"
	customerCity: string; // e.g. "Karachi"
	customerAddress?: string;
	customerPhone?: string;
	items: OrderItem[];
	totalQuantity: number;
	type: OrderType;
	totalAmount: number; // in PKR Rs.
	shippingCharges: number;
	cashReceived: number;
	netBill: number;
	finalBalance: number;
	status: OrderStatus;
	date: string; // e.g. "07 Nov 2026"
	dateTimeFull: string; // e.g. "07 NOV 26 21:54"
	paymentMethod: "On Credit / COD" | "Cash on Counter" | "Online Transfer";
	godown: string; // e.g. "HEAD OFFICE" or "SADDAR WORKSHOP"
	remarks?: string;
}

export const INITIAL_ORDERS: OrderRecord[] = [
	{
		id: "#SA-56143",
		invoiceNumber: "SA-64276",
		customerName: "Afraz Auto Works",
		customerCity: "Karachi",
		customerAddress: "Sarfraz auto market, Saddar Karachi",
		customerPhone: "+92 333 1285556",
		type: "Wholesale",
		items: [
			{
				name: "Crown QINGQI-4ST Piston Kit 1...",
				subLabel: "STANDARD 70CC",
				quantity: 9,
				rate: 1450,
				total: 13050,
			},
			{
				name: "Crown CD70F Clutch Gear Big ...",
				subLabel: "OEM GRADE",
				quantity: 19,
				rate: 1120,
				total: 21280,
			},
			{
				name: "Crown CD70F Wheel Sleeve",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 78,
				total: 78,
			},
			{
				name: "Crown 420X104L Wheel Chain",
				subLabel: "HEAVY DUTY 420x104L",
				quantity: 1,
				rate: 805,
				total: 805,
			},
			{
				name: "Crown CD70-CDI Axle Center With Nut",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 124,
				total: 124,
			},
			{
				name: "Crown CG125 Back Light Complete",
				subLabel: "STANDARD ASSY",
				quantity: 1,
				rate: 375,
				total: 375,
			},
			{
				name: "Crown CD70-CDI Air Lota",
				subLabel: "70CC AIR FILTER",
				quantity: 1,
				rate: 130,
				total: 130,
			},
		],
		totalQuantity: 245,
		totalAmount: 73438,
		shippingCharges: 250,
		cashReceived: 0,
		netBill: 73688,
		finalBalance: 73688,
		status: "Cancelled",
		date: "07 Nov 2026",
		dateTimeFull: "07 NOV 26 21:54",
		paymentMethod: "On Credit / COD",
		godown: "HEAD OFFICE",
		remarks: "Dealer order - Cancelled upon client call",
	},
	{
		id: "#SA-64276",
		invoiceNumber: "SA-64276",
		customerName: "Afraz",
		customerCity: "Karachi",
		customerAddress: "Taj Mehal Qasim Auto Mkt, Karachi",
		customerPhone: "03331285556, 03332624410",
		type: "Wholesale",
		items: [
			{
				name: "Crown CD70F Wheel Sleeve",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 78,
				total: 78,
			},
			{
				name: "Crown 420X104L Wheel Chain 420x104l",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 805,
				total: 805,
			},
			{
				name: "Crown CD70-CDI Axle Center With Nut",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 124,
				total: 124,
			},
			{
				name: "Crown CG125 Back Light Complete",
				subLabel: "STANDARD",
				quantity: 1,
				rate: 375,
				total: 375,
			},
			{
				name: "Crown CD70-CDI Air Lota",
				subLabel: "70CC",
				quantity: 1,
				rate: 130,
				total: 130,
			},
		],
		totalQuantity: 5,
		totalAmount: 1512,
		shippingCharges: 250,
		cashReceived: 0,
		netBill: 1762,
		finalBalance: 1762,
		status: "Completed",
		date: "06 Nov 2026",
		dateTimeFull: "06 NOV 26 21:54",
		paymentMethod: "On Credit / COD",
		godown: "HEAD OFFICE",
		remarks: "Address: Sarfraz auto... OWNER",
	},
	{
		id: "#SA-58921",
		invoiceNumber: "SA-58921",
		customerName: "Rashid Auto Spares",
		customerCity: "Hyderabad",
		customerAddress: "Station Road Auto Market",
		customerPhone: "+92 312 9988771",
		type: "Retail",
		items: [
			{
				name: "Atlas Honda Genuine Engine Oil 4T 20W40",
				subLabel: "0.7 LITRE PACK",
				quantity: 12,
				rate: 980,
				total: 11760,
			},
			{
				name: "Crown CD70 Brake Shoe Set Front/Rear",
				subLabel: "ASBESTOS FREE",
				quantity: 8,
				rate: 320,
				total: 2560,
			},
			{
				name: "NGK C7HSA Spark Plug Genuine",
				subLabel: "COPPER CORE",
				quantity: 20,
				rate: 290,
				total: 5800,
			},
		],
		totalQuantity: 40,
		totalAmount: 20120,
		shippingCharges: 400,
		cashReceived: 20520,
		netBill: 20520,
		finalBalance: 0,
		status: "Completed",
		date: "05 Nov 2026",
		dateTimeFull: "05 NOV 26 17:30",
		paymentMethod: "Cash on Counter",
		godown: "SADDAR WORKSHOP",
		remarks: "Paid in full via cash counter",
	},
	{
		id: "#SA-59042",
		invoiceNumber: "SA-59042",
		customerName: "Usman & Sons Motor Parts",
		customerCity: "Rawalpindi",
		customerAddress: "Gawalmandi Auto Zone",
		customerPhone: "+92 345 5566778",
		type: "Wholesale",
		items: [
			{
				name: "Crown Complete Wiring Harness CG125",
				subLabel: "CDI 12 VOLT",
				quantity: 15,
				rate: 1850,
				total: 27750,
			},
			{
				name: "Crown Shock Absorber Rear Pair",
				subLabel: "CHROME FINISH",
				quantity: 10,
				rate: 3400,
				total: 34000,
			},
		],
		totalQuantity: 25,
		totalAmount: 61750,
		shippingCharges: 1200,
		cashReceived: 30000,
		netBill: 62950,
		finalBalance: 32950,
		status: "In-Progress",
		date: "05 Nov 2026",
		dateTimeFull: "05 NOV 26 14:15",
		paymentMethod: "On Credit / COD",
		godown: "HEAD OFFICE",
		remarks: "TCS Cargo courier dispatch awaiting tracking no.",
	},
	{
		id: "#SA-59118",
		invoiceNumber: "SA-59118",
		customerName: "Bilal Motors",
		customerCity: "Karachi",
		customerAddress: "Gulshan-e-Iqbal Block 13-D",
		customerPhone: "+92 300 4433221",
		type: "Retail",
		items: [
			{
				name: "Front Fork Pipe Set CD70 (Pair)",
				subLabel: "HARD CHROME",
				quantity: 2,
				rate: 2200,
				total: 4400,
			},
			{
				name: "Handle Bar Standard CD70 Black",
				subLabel: "ORIGINAL THICKNESS",
				quantity: 3,
				rate: 850,
				total: 2550,
			},
		],
		totalQuantity: 5,
		totalAmount: 6950,
		shippingCharges: 0,
		cashReceived: 6950,
		netBill: 6950,
		finalBalance: 0,
		status: "Completed",
		date: "04 Nov 2026",
		dateTimeFull: "04 NOV 26 19:40",
		paymentMethod: "Cash on Counter",
		godown: "GULSHAN HUB",
		remarks: "Customer direct pickup at counter bay 2",
	},
	{
		id: "#SA-59230",
		invoiceNumber: "SA-59230",
		customerName: "Tariq Autos Trading",
		customerCity: "Lahore",
		customerAddress: "Mcleod Road Motorcycle Market",
		customerPhone: "+92 321 7766554",
		type: "Wholesale",
		items: [
			{
				name: "Crown CDI Unit Digital Ignition CD70",
				subLabel: "ELECTRONIC RACING",
				quantity: 50,
				rate: 420,
				total: 21000,
			},
			{
				name: "Crown Ignition Coil with Cable",
				subLabel: "HIGH VOLTAGE",
				quantity: 40,
				rate: 310,
				total: 12400,
			},
			{
				name: "Crown Headlight Assembly Halogen",
				subLabel: "12V 35W",
				quantity: 20,
				rate: 950,
				total: 19000,
			},
		],
		totalQuantity: 110,
		totalAmount: 52400,
		shippingCharges: 1500,
		cashReceived: 0,
		netBill: 53900,
		finalBalance: 53900,
		status: "Pending",
		date: "04 Nov 2026",
		dateTimeFull: "04 NOV 26 11:20",
		paymentMethod: "On Credit / COD",
		godown: "HEAD OFFICE",
		remarks: "Order booked - Goods packaging underway",
	},
];

