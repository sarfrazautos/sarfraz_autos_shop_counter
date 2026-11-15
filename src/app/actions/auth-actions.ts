"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdminAction(data: {
	email: string;
	password: string;
}) {
	const emailInput = (data.email || "").trim().toLowerCase();
	const passwordInput = data.password || "";

	// Expected admin credentials from environment or fallback
	const targetEmail = (
		process.env.ADMIN_EMAIL || "admin@sarfrazautos-counter.com"
	)
		.trim()
		.toLowerCase();
	const targetPassword = process.env.ADMIN_PASSWORD || "111shahmeer111";

	// Artificial slight delay for natural security & loading state visibility
	await new Promise((res) => setTimeout(res, 600));

	if (emailInput !== targetEmail) {
		return {
			success: false,
			error: "Unrecognized administrator email. Please verify your shop account email address.",
		};
	}

	if (passwordInput !== targetPassword) {
		return {
			success: false,
			error: "Incorrect admin password. Please check your credentials and try again.",
		};
	}

	// Generate secure session token
	const sessionToken = `admin_session_${Date.now()}_${Math.random()
		.toString(36)
		.substring(2, 10)}`;

	// Set secure HTTP-only cookie
	const cookieStore = await cookies();
	cookieStore.set("sarfraz_auth_session", sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7, // 7 days
	});

	return {
		success: true,
		user: {
			name: "Shahmeer (Owner)",
			email: targetEmail,
			role: "Administrator",
		},
	};
}

export async function logoutAdminAction() {
	const cookieStore = await cookies();
	cookieStore.delete("sarfraz_auth_session");
	return { success: true };
}
