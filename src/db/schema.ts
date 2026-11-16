import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Tabela de usuários autenticados via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de categorias principais com subcategorias agrupadas
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('Store'),
  subcategories: jsonb('subcategories').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de negócios e prestadores de serviços
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid'), // Firebase Auth UID do morador
  ownerName: text('owner_name').notNull(), // Nome completo do responsável
  name: text('name').notNull(), // Nome comercial
  categoryId: integer('category_id').references(() => categories.id),
  categoryName: text('category_name').notNull(),
  subcategory: text('subcategory'), // Atividade específica / subcategoria / nicho personalizado
  description: text('description').notNull(),
  whatsapp: text('whatsapp').notNull(), // DDD + Número (ex: 14999999999)
  keywords: text('keywords').notNull(), // Palavras-chave separadas por vírgula
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'suspended'
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: text('reviewed_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de mensagens de contato institucional
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // 'unread' | 'read' | 'replied'
  createdAt: timestamp('created_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one }) => ({
  category: one(categories, {
    fields: [businesses.categoryId],
    references: [categories.id],
  }),
}));
