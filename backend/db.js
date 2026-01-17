import Database from "better-sqlite3";

export const db = new Database("clown.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  clown_name TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0
);
`);

export function now() {
  return Math.floor(Date.now() / 1000);
}