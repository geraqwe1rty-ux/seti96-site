CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`client_type` text NOT NULL,
	`page` text,
	`status` text DEFAULT 'новая' NOT NULL,
	`telegram_status` text DEFAULT 'не настроен' NOT NULL,
	`comment` text
);
