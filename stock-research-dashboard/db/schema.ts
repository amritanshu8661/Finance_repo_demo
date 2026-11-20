import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const libraryUsers = sqliteTable("library_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const libraryItems = sqliteTable("library_items", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["prices", "financials", "attachment", "source"] }).notNull(),
  filename: text("filename"),
  mimeType: text("mime_type"),
  size: integer("size").notNull().default(0),
  rowCount: integer("row_count").notNull().default(0),
  currency: text("currency").notNull(),
  visibility: text("visibility", { enum: ["private", "shared"] }).notNull().default("private"),
  ownerId: text("owner_id").notNull().references(() => libraryUsers.id),
  ownerName: text("owner_name").notNull(),
  parentId: text("parent_id"),
  createdAt: text("created_at").notNull(),
  archivedAt: text("archived_at"),
  url: text("url"),
  objectKey: text("object_key"),
  parsedKey: text("parsed_key"),
}, table => [index("library_items_owner_idx").on(table.ownerId), index("library_items_company_idx").on(table.symbol, table.archivedAt), index("library_items_parent_idx").on(table.parentId), uniqueIndex("library_one_active_child_idx").on(table.parentId).where(sql`${table.parentId} IS NOT NULL AND ${table.archivedAt} IS NULL`)]);

export const libraryAudit = sqliteTable("library_audit", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
}, table => [index("library_audit_created_idx").on(table.createdAt)]);
