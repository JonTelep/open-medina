CREATE TABLE `bill_sponsors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`legislator_id` integer NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`legislator_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bill_sponsors_bill` ON `bill_sponsors` (`bill_id`);--> statement-breakpoint
CREATE INDEX `idx_bill_sponsors_legislator` ON `bill_sponsors` (`legislator_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bill_sponsors_unique` ON `bill_sponsors` (`bill_id`,`legislator_id`);--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`legiscan_bill_id` integer,
	`session_id` integer,
	`bill_number` text,
	`title` text NOT NULL,
	`description` text,
	`chamber` text,
	`status` integer,
	`status_label` text,
	`status_date` text,
	`last_action` text,
	`last_action_date` text,
	`url` text,
	`change_hash` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bills_legiscan` ON `bills` (`legiscan_bill_id`);--> statement-breakpoint
CREATE INDEX `idx_bills_chamber` ON `bills` (`chamber`);--> statement-breakpoint
CREATE INDEX `idx_bills_status` ON `bills` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bills_session` ON `bills` (`session_id`);--> statement-breakpoint
CREATE TABLE `county_resolutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resolution_number` text,
	`date` text,
	`title` text NOT NULL,
	`description` text,
	`pdf_url` text,
	`body` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_resolutions_number` ON `county_resolutions` (`resolution_number`);--> statement-breakpoint
CREATE INDEX `idx_resolutions_date` ON `county_resolutions` (`date`);--> statement-breakpoint
CREATE TABLE `legislator_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roll_call_id` integer NOT NULL,
	`legislator_id` integer NOT NULL,
	`vote` text NOT NULL,
	FOREIGN KEY (`roll_call_id`) REFERENCES `roll_call_votes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`legislator_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_legislator_votes_roll_call` ON `legislator_votes` (`roll_call_id`);--> statement-breakpoint
CREATE INDEX `idx_legislator_votes_legislator` ON `legislator_votes` (`legislator_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_legislator_votes_unique` ON `legislator_votes` (`roll_call_id`,`legislator_id`);--> statement-breakpoint
CREATE TABLE `legislators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`legiscan_people_id` integer,
	`person_id` integer,
	`name` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`party` text,
	`chamber` text,
	`district` text,
	`image_url` text,
	`email` text,
	`bio_url` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_legislators_legiscan` ON `legislators` (`legiscan_people_id`);--> statement-breakpoint
CREATE INDEX `idx_legislators_person` ON `legislators` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_legislators_chamber` ON `legislators` (`chamber`);--> statement-breakpoint
CREATE TABLE `roll_call_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`legiscan_roll_call_id` integer,
	`date` text,
	`chamber` text,
	`description` text,
	`yea` integer DEFAULT 0,
	`nay` integer DEFAULT 0,
	`nv` integer DEFAULT 0,
	`absent` integer DEFAULT 0,
	`passed` integer DEFAULT 0,
	`source` text NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_roll_calls_bill` ON `roll_call_votes` (`bill_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_roll_calls_legiscan` ON `roll_call_votes` (`legiscan_roll_call_id`);