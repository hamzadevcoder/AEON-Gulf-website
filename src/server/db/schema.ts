import {
  pgTable, pgEnum, text, uuid, timestamp, boolean, integer, jsonb, bigserial, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['admin', 'editor', 'agent', 'viewer']);
export const formTypeEnum = pgEnum('form_type', ['contact', 'quote', 'newsletter']);
export const submissionStatusEnum = pgEnum('submission_status', ['new', 'in_progress', 'responded', 'closed', 'spam']);
export const noteKindEnum = pgEnum('note_kind', ['note', 'status', 'assignment', 'email']);
export const emailStatusEnum = pgEnum('email_status', ['sent', 'failed', 'skipped']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ------------------------------------------------------------------ Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex('users_email_key').on(sql`lower(${t.email})`)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // SHA-256 of the cookie token
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)]);

export const loginAttempts = pgTable('login_attempts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull(),
  ip: text('ip'),
  success: boolean('success').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('login_attempts_email_idx').on(t.email, t.createdAt), index('login_attempts_ip_idx').on(t.ip, t.createdAt)]);

// ------------------------------------------------------------------ Forms
export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: formTypeEnum('type').notNull(),
  status: submissionStatusEnum('status').notNull().default('new'),
  name: text('name'),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  country: text('country'),
  service: text('service'),
  message: text('message'),
  data: jsonb('data').$type<Record<string, string>>().notNull().default({}),
  sourcePage: text('source_page'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => [
  index('submissions_status_idx').on(t.status),
  index('submissions_type_idx').on(t.type),
  index('submissions_created_idx').on(t.createdAt),
  index('submissions_ip_idx').on(t.ip, t.createdAt),
]);

export const submissionNotes = pgTable('submission_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  kind: noteKindEnum('kind').notNull().default('note'),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('submission_notes_submission_idx').on(t.submissionId, t.createdAt)]);

export const notificationRecipients = pgTable('notification_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  formTypes: text('form_types').array().notNull().default(sql`ARRAY['contact','quote','newsletter']::text[]`),
  active: boolean('active').notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex('notification_recipients_email_key').on(sql`lower(${t.email})`)]);

export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'set null' }),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  status: emailStatusEnum('status').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('email_log_created_idx').on(t.createdAt)]);

// ------------------------------------------------------------------ Content
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contentBlocks = pgTable('content_blocks', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const countries = pgTable('countries', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  line: text('line').notNull().default(''),
  intro: text('intro').notNull().default(''),
  authoritiesSummary: text('authorities_summary').notNull().default(''),
  quickFacts: jsonb('quick_facts').$type<{ label: string; value: string }[]>().notNull().default([]),
  authorities: jsonb('authorities').$type<string[]>().notNull().default([]),
  office: jsonb('office').$type<{ detail: string; phone: string | null }>().notNull().default({ detail: '', phone: null }),
  ar: jsonb('ar').$type<Record<string, unknown> | null>(), // Arabic version (null = not translated)
  sort: integer('sort').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  country: text('country').notNull().references(() => countries.slug, { onUpdate: 'cascade' }),
  slug: text('slug').notNull(),
  group: text('group').notNull(),
  groupLabel: text('group_label').notNull(),
  name: text('name').notNull(),
  metaTitle: text('meta_title').notNull(),
  metaDescription: text('meta_description').notNull(),
  keywords: text('keywords').array().notNull().default(sql`ARRAY[]::text[]`),
  listingBody: text('listing_body').notNull(),
  heroHeading: text('hero_heading').notNull(),
  heroSubtitle: text('hero_subtitle').notNull(),
  whyHeading: text('why_heading').notNull(),
  whyDescription: text('why_description').notNull(),
  benefits: jsonb('benefits').$type<{ title: string; text: string }[]>().notNull(),
  stepsHeading: text('steps_heading').notNull(),
  steps: jsonb('steps').$type<{ title: string; text: string }[]>().notNull(),
  faqs: jsonb('faqs').$type<{ q: string; a: string }[]>().notNull(),
  ctaHeading: text('cta_heading').notNull(),
  ctaDescription: text('cta_description').notNull(),
  ctaText: text('cta_text').notNull(),
  ar: jsonb('ar').$type<Record<string, unknown> | null>(), // Arabic version (null = not translated)
  published: boolean('published').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => [uniqueIndex('services_country_slug_key').on(t.country, t.slug), index('services_country_group_idx').on(t.country, t.group, t.sort)]);

export const guides = pgTable('guides', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  metaTitle: text('meta_title').notNull(),
  metaDescription: text('meta_description').notNull(),
  country: text('country').notNull().references(() => countries.slug, { onUpdate: 'cascade' }),
  category: text('category').notNull().default('Guide'),
  image: text('image').notNull(), // image slot key or full URL
  service: text('service').notNull(), // related service slug in that country
  ar: jsonb('ar').$type<Record<string, unknown> | null>(), // Arabic version (null = not translated)
  intro: jsonb('intro').$type<string[]>().notNull().default([]),
  published: boolean('published').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
});

export const legalPages = pgTable('legal_pages', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  effective: text('effective').notNull(),
  intro: jsonb('intro').notNull(),
  ar: jsonb('ar').$type<Record<string, unknown> | null>(), // Arabic version (null = not translated)
  sections: jsonb('sections').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PageSection = { id: string; type: string; hidden?: boolean; data: Record<string, unknown>; dataAr?: Record<string, unknown> };

/** Pages created in the dashboard, built from section templates. */
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  metaTitle: text('meta_title').notNull().default(''),
  metaDescription: text('meta_description').notNull().default(''),
  published: boolean('published').notNull().default(false),
  showInMenu: boolean('show_in_menu').notNull().default(false),
  ar: jsonb('ar').$type<Record<string, unknown> | null>(), // Arabic version (null = not translated)
  sections: jsonb('sections').$type<PageSection[]>().notNull().default([]),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => [uniqueIndex('pages_slug_key').on(t.slug)]);

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  alt: text('alt').notNull().default(''),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('media_created_idx').on(t.createdAt)]);

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('audit_log_created_idx').on(t.createdAt), index('audit_log_entity_idx').on(t.entity, t.entityId)]);

export type User = typeof users.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type FormType = (typeof formTypeEnum.enumValues)[number];
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
