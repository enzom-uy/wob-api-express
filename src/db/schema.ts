import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique('tags_name_key'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

export const wob = pgTable('wob', {
  id: uuid('id').defaultRandom().primaryKey(),
  coppermindId: integer('coppermind_id').notNull().unique(),
  eventId: integer('event_id'),
  data: jsonb('data').notNull(),
  note: text('note'),
  sourceUrl: text('source_url').unique('idx_wob_source_url'),
  date: timestamp('date', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

export const wobTags = pgTable('wob_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  wobId: uuid('wob_id')
    .notNull()
    .references(() => wob.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

