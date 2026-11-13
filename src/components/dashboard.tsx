import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { RecentConversations } from "@/components/recent-conversations";
import { DashboardStats } from "@/components/stats";
import { SupportActivity } from "@/components/support-activity";
import { TeamOnDuty } from "@/components/team-on-duty";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pb-12">
			{/* Top 4 Stats Cards */}
			<DashboardStats />

			{/* Sales Revenue Generated (3 cols) & Sales by Order Type (1 col) */}
			<ConversationVolumeChart />
			<ChannelBreakdownChart />

			{/* Branch Performance (2 cols) & Top Bike Models Demand (2 cols) */}
			<CsatResponsesChart />
			<FirstReplyTimeChart />

			{/* Recent Counter Orders (2 cols) & Branch Employees on Duty (2 cols) */}
			<RecentConversations />
			<TeamOnDuty />

			{/* Counter & Inventory Live Activity (4 cols) */}
			<SupportActivity />
		</div>
	);
}
