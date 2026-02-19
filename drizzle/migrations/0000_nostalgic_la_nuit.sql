CREATE TABLE `budget_line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`department` text,
	`category` text,
	`fund` text,
	`description` text,
	`budgeted_amount` real,
	`actual_amount` real,
	`year` integer,
	FOREIGN KEY (`report_id`) REFERENCES `financial_reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_budget_items_report` ON `budget_line_items` (`report_id`);--> statement-breakpoint
CREATE INDEX `idx_budget_items_dept` ON `budget_line_items` (`department`);--> statement-breakpoint
CREATE INDEX `idx_budget_items_year` ON `budget_line_items` (`year`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer,
	`candidate_name` text NOT NULL,
	`committee_name` text,
	`office` text,
	`party` text,
	`year` integer,
	`source` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_campaigns_person` ON `campaigns` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_campaigns_candidate` ON `campaigns` (`candidate_name`);--> statement-breakpoint
CREATE TABLE `docket_line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`docket_id` integer NOT NULL,
	`person_id` integer,
	`raw_vendor_name` text NOT NULL,
	`department` text,
	`description` text,
	`amount` real NOT NULL,
	`check_number` text,
	`fund` text,
	FOREIGN KEY (`docket_id`) REFERENCES `dockets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_docket_items_docket` ON `docket_line_items` (`docket_id`);--> statement-breakpoint
CREATE INDEX `idx_docket_items_person` ON `docket_line_items` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_docket_items_vendor` ON `docket_line_items` (`raw_vendor_name`);--> statement-breakpoint
CREATE INDEX `idx_docket_items_department` ON `docket_line_items` (`department`);--> statement-breakpoint
CREATE TABLE `dockets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`title` text,
	`total_amount` real,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dockets_date` ON `dockets` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dockets_unique` ON `dockets` (`date`,`source`);--> statement-breakpoint
CREATE TABLE `donations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`donor_person_id` integer,
	`raw_donor_name` text NOT NULL,
	`donor_address` text,
	`donor_city` text,
	`donor_state` text,
	`donor_zip` text,
	`donor_employer` text,
	`donor_occupation` text,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`type` text,
	`source` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`donor_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_donations_campaign` ON `donations` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `idx_donations_donor` ON `donations` (`donor_person_id`);--> statement-breakpoint
CREATE INDEX `idx_donations_date` ON `donations` (`date`);--> statement-breakpoint
CREATE INDEX `idx_donations_amount` ON `donations` (`amount`);--> statement-breakpoint
CREATE TABLE `financial_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`year` integer,
	`body` text,
	`file_path` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_year` ON `financial_reports` (`year`);--> statement-breakpoint
CREATE INDEX `idx_reports_type` ON `financial_reports` (`type`);--> statement-breakpoint
CREATE TABLE `meeting_mentions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meeting_id` integer NOT NULL,
	`person_id` integer,
	`raw_name` text NOT NULL,
	`context` text,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_mentions_meeting` ON `meeting_mentions` (`meeting_id`);--> statement-breakpoint
CREATE INDEX `idx_mentions_person` ON `meeting_mentions` (`person_id`);--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`title` text,
	`body` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meetings_date` ON `meetings` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_meetings_unique` ON `meetings` (`date`,`source`);--> statement-breakpoint
CREATE TABLE `name_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer NOT NULL,
	`raw_name` text NOT NULL,
	`normalized_key` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_aliases_person` ON `name_aliases` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_aliases_normalized` ON `name_aliases` (`normalized_key`);--> statement-breakpoint
CREATE INDEX `idx_aliases_raw` ON `name_aliases` (`raw_name`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`type` text DEFAULT 'person' NOT NULL,
	`department` text,
	`title` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_people_display_name` ON `people` (`display_name`);--> statement-breakpoint
CREATE INDEX `idx_people_type` ON `people` (`type`);--> statement-breakpoint
CREATE INDEX `idx_people_department` ON `people` (`department`);--> statement-breakpoint
CREATE TABLE `salaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer,
	`raw_name` text NOT NULL,
	`department` text,
	`title` text,
	`salary` real NOT NULL,
	`year` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_salaries_person` ON `salaries` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_salaries_year` ON `salaries` (`year`);--> statement-breakpoint
CREATE INDEX `idx_salaries_department` ON `salaries` (`department`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_salaries_unique` ON `salaries` (`raw_name`,`year`,`department`);--> statement-breakpoint
CREATE TABLE `scraper_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scraper_name` text NOT NULL,
	`status` text NOT NULL,
	`records_processed` integer DEFAULT 0,
	`records_created` integer DEFAULT 0,
	`records_updated` integer DEFAULT 0,
	`error` text,
	`started_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_scraper_runs_name` ON `scraper_runs` (`scraper_name`);--> statement-breakpoint
CREATE INDEX `idx_scraper_runs_status` ON `scraper_runs` (`status`);