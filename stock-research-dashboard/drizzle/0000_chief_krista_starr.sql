CREATE TABLE `library_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `library_audit_created_idx` ON `library_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `library_items` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`company_name` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`filename` text,
	`mime_type` text,
	`size` integer DEFAULT 0 NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL,
	`currency` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`owner_id` text NOT NULL,
	`owner_name` text NOT NULL,
	`parent_id` text,
	`created_at` text NOT NULL,
	`archived_at` text,
	`url` text,
	`object_key` text,
	`parsed_key` text,
	FOREIGN KEY (`owner_id`) REFERENCES `library_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `library_items_owner_idx` ON `library_items` (`owner_id`);--> statement-breakpoint
CREATE INDEX `library_items_company_idx` ON `library_items` (`symbol`,`archived_at`);--> statement-breakpoint
CREATE INDEX `library_items_parent_idx` ON `library_items` (`parent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_one_active_child_idx` ON `library_items` (`parent_id`) WHERE "library_items"."parent_id" IS NOT NULL AND "library_items"."archived_at" IS NULL;--> statement-breakpoint
CREATE TABLE `library_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER library_version_parent_insert
BEFORE INSERT ON library_items
WHEN NEW.parent_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM library_items p WHERE p.id=NEW.parent_id AND p.archived_at IS NULL
      AND p.symbol=NEW.symbol AND p.kind=NEW.kind AND p.currency=NEW.currency
      AND p.visibility=NEW.visibility AND p.owner_id=NEW.owner_id
  ) THEN RAISE(ABORT, 'version parent unavailable or inconsistent') END;
END;
--> statement-breakpoint
CREATE TRIGGER library_archive_version_guard
BEFORE UPDATE OF archived_at ON library_items
WHEN NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM library_items c WHERE c.parent_id=OLD.id AND c.archived_at IS NULL
  ) THEN RAISE(ABORT, 'archive latest version first') END;
END;
--> statement-breakpoint
CREATE TRIGGER library_restore_version_guard
BEFORE UPDATE OF archived_at ON library_items
WHEN NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL AND NEW.parent_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM library_items p WHERE p.id=NEW.parent_id AND p.archived_at IS NULL
      AND p.symbol=NEW.symbol AND p.kind=NEW.kind AND p.currency=NEW.currency
      AND p.visibility=NEW.visibility AND p.owner_id=NEW.owner_id
  ) THEN RAISE(ABORT, 'restore previous version first') END;
END;
--> statement-breakpoint
CREATE TRIGGER library_version_visibility_guard
BEFORE UPDATE OF visibility ON library_items
WHEN NEW.visibility<>OLD.visibility
BEGIN
  SELECT CASE WHEN OLD.parent_id IS NOT NULL OR EXISTS (
    SELECT 1 FROM library_items c WHERE c.parent_id=OLD.id
  ) THEN RAISE(ABORT, 'version sharing must remain consistent') END;
END;
--> statement-breakpoint
CREATE TRIGGER library_last_admin_guard
BEFORE UPDATE OF role ON library_users
WHEN OLD.role='admin' AND NEW.role<>'admin'
BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM library_users WHERE role='admin')<=1
    THEN RAISE(ABORT, 'at least one administrator must remain') END;
END;
