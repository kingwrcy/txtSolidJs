import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';


export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  is_admin: integer('is_admin').notNull().default(0),
  is_active: integer('is_active').notNull().default(1),
  last_login: integer('last_login').notNull(),
  last_login_ip: text('last_login_ip').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
  deleted_at: integer('deleted_at').notNull()
});

export const memos = sqliteTable('memos', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  html_content: text('html_content').notNull(),
  user_id: integer('user_id'),
  ip: text('ip').notNull(),
  same_ip: integer('same_ip').notNull().default(0),
  views: integer('views').notNull().default(0),
  type: text('type').notNull().default('text'),
  password: text('password'),
  path: text('path').notNull().unique(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
  deleted_at: integer('deleted_at').notNull(),
});



const sqlite = new Database(process.env.DB_FILE_NAME!);
const db = drizzle({ client: sqlite });



export default db;