CREATE TABLE `memos` (
	`id` integer PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`html_content` text NOT NULL,
	`user_id` integer,
	`ip` text NOT NULL,
	`same_ip` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`password` text,
	`path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memos_path_unique` ON `memos` (`path`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`is_admin` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_login` integer NOT NULL,
	`last_login_ip` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);