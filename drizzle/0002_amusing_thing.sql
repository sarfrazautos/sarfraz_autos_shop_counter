CREATE TABLE "attendance_records" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"branch_id" varchar(50) NOT NULL,
	"attendance_date" date NOT NULL,
	"status" varchar(30) DEFAULT 'present' NOT NULL,
	"check_in_time" varchar(20) DEFAULT '--' NOT NULL,
	"check_out_time" varchar(20) DEFAULT '--' NOT NULL,
	"shift_timing" varchar(50) DEFAULT '09:00 AM - 07:00 PM' NOT NULL,
	"overtime_hours" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_nodes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"branch_id" varchar(50) NOT NULL,
	"counter_name" varchar(150) NOT NULL,
	"ip_address" varchar(50) NOT NULL,
	"ping_latency_ms" integer DEFAULT 15 NOT NULL,
	"status" varchar(30) DEFAULT 'online' NOT NULL,
	"last_sync_time" timestamp DEFAULT now() NOT NULL,
	"sync_health" varchar(50) DEFAULT 'Fully Operational' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(50) NOT NULL,
	"manager_name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_ledger_transactions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"order_id" varchar(50),
	"voucher_number" varchar(100) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"debit_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"credit_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"running_balance" numeric(12, 2) NOT NULL,
	"collector_name" varchar(100),
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_ledger_transactions_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"city" varchar(100) DEFAULT 'Karachi' NOT NULL,
	"route" varchar(150) DEFAULT 'Saddar Counter' NOT NULL,
	"salesman" varchar(100) DEFAULT 'Counter Cashier' NOT NULL,
	"customer_type" varchar(50) DEFAULT 'Wholesale Dealer' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'Credit / Khata' NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"current_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"credit_limit" numeric(12, 2) DEFAULT '100000.00' NOT NULL,
	"last_payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "delivery_riders" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"vehicle_number" varchar(50) NOT NULL,
	"current_status" varchar(30) DEFAULT 'offline' NOT NULL,
	"current_latitude" numeric(10, 6) DEFAULT '24.860700' NOT NULL,
	"current_longitude" numeric(10, 6) DEFAULT '67.001100' NOT NULL,
	"active_order_id" varchar(50),
	"last_ping_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_riders_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"branch_id" varchar(50),
	"is_read" boolean DEFAULT false NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"action_label" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"bike_model" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"unit_rate" numeric(10, 2) NOT NULL,
	"pricing_tier" varchar(30) DEFAULT 'Wholesale' NOT NULL,
	"is_scheme_applied" boolean DEFAULT false NOT NULL,
	"scheme_rate" numeric(10, 2),
	"quantity" integer NOT NULL,
	"line_total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"customer_city" varchar(100) DEFAULT 'Karachi' NOT NULL,
	"branch_id" varchar(50) NOT NULL,
	"order_type" varchar(30) DEFAULT 'Wholesale' NOT NULL,
	"order_status" varchar(30) DEFAULT 'Completed' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'Cash on Counter' NOT NULL,
	"subtotal_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"shipping_charges" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"cash_received" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"change_returned" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"net_balance_added" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"remarks" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "product_branch_stock" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"branch_id" varchar(50) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"old_cost_price" numeric(10, 2),
	"new_cost_price" numeric(10, 2),
	"old_wholesale_price" numeric(10, 2) NOT NULL,
	"new_wholesale_price" numeric(10, 2) NOT NULL,
	"old_retail_price" numeric(10, 2) NOT NULL,
	"new_retail_price" numeric(10, 2) NOT NULL,
	"reason" text,
	"changed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100) DEFAULT 'Crown' NOT NULL,
	"category" varchar(100) NOT NULL,
	"listing_type" varchar(30) DEFAULT 'Wholesale' NOT NULL,
	"bike_model" varchar(100) NOT NULL,
	"cost_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"retail_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"wholesale_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_stock" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 15 NOT NULL,
	"unit" varchar(30) DEFAULT 'Pcs' NOT NULL,
	"image_url" text DEFAULT '/logo.png' NOT NULL,
	"status" varchar(30) DEFAULT 'In Stock' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "rider_location_logs" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"rider_id" varchar(50) NOT NULL,
	"latitude" numeric(10, 6) NOT NULL,
	"longitude" numeric(10, 6) NOT NULL,
	"speed_kmh" numeric(5, 2),
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"branch_id" varchar(50) NOT NULL,
	"avatar_url" text,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"joined_date" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "trade_schemes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"scheme_type" varchar(50) NOT NULL,
	"buy_quantity" integer DEFAULT 1 NOT NULL,
	"free_quantity" integer DEFAULT 0 NOT NULL,
	"net_scheme_rate" numeric(10, 2),
	"applicable_tier" varchar(50) DEFAULT 'Wholesale Only' NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp NOT NULL,
	"status" varchar(30) DEFAULT 'Active' NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_team_members_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_nodes" ADD CONSTRAINT "branch_nodes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_ledger_transactions" ADD CONSTRAINT "customer_ledger_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_ledger_transactions" ADD CONSTRAINT "customer_ledger_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_riders" ADD CONSTRAINT "delivery_riders_active_order_id_orders_id_fk" FOREIGN KEY ("active_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branch_stock" ADD CONSTRAINT "product_branch_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branch_stock" ADD CONSTRAINT "product_branch_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_location_logs" ADD CONSTRAINT "rider_location_logs_rider_id_delivery_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."delivery_riders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_schemes" ADD CONSTRAINT "trade_schemes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "att_employee_date_idx" ON "attendance_records" USING btree ("employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "att_branch_idx" ON "attendance_records" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "clt_customer_idx" ON "customer_ledger_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "clt_voucher_idx" ON "customer_ledger_transactions" USING btree ("voucher_number");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_route_idx" ON "customers" USING btree ("route");--> statement-breakpoint
CREATE INDEX "riders_status_idx" ON "delivery_riders" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "notif_type_idx" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_invoice_idx" ON "orders" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_branch_idx" ON "orders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "pbs_product_branch_idx" ON "product_branch_stock" USING btree ("product_id","branch_id");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_bike_model_idx" ON "products" USING btree ("bike_model");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rll_rider_time_idx" ON "rider_location_logs" USING btree ("rider_id","recorded_at");--> statement-breakpoint
CREATE INDEX "team_branch_idx" ON "team_members" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trade_schemes_product_idx" ON "trade_schemes" USING btree ("product_id");