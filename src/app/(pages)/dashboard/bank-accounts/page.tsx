import { AppShell } from "@/components/app-shell";
import { BankAccountsView } from "@/components/BankAccounts/bank-accounts-view";

export default function BankAccountsPage() {
	return (
		<AppShell pathname="/dashboard/bank-accounts">
			<BankAccountsView />
		</AppShell>
	);
}
