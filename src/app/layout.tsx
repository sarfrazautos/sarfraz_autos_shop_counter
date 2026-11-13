import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: {
		default: "Sarfraz Autos - Shop Counter & Inventory Management",
		template: "%s | Sarfraz Autos",
	},
	description:
		"Professional motorcycle spare parts inventory, POS counter billing, multi-branch stock management, and thermal invoicing system for Sarfraz Autos.",
	applicationName: "Sarfraz Autos Counter",
	keywords: [
		"Sarfraz Autos",
		"Motorcycle Spare Parts",
		"Shop Counter",
		"POS Billing",
		"Honda CD70",
		"Honda CG125",
		"Crown Parts",
		"Karachi Auto Market",
		"Thermal Invoicing",
	],
	authors: [{ name: "Sarfraz Autos" }],
	creator: "Sarfraz Autos",
	icons: {
		icon: [
			{ url: "/icon.png", type: "image/png" },
			{ url: "/logo.png", type: "image/png" },
		],
		shortcut: "/logo.png",
		apple: "/apple-icon.png",
	},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={cn("h-full antialiased font-sans", inter.variable)}>
			<body className={cn("min-h-full flex flex-col font-sans", inter.className)}>
				{children}
			</body>
		</html>
	);
}
