import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface DbInstance extends Database.Database {}

export function createDatabase(customPath?: string): DbInstance {
  let dbPath: string;

  if (customPath) {
    dbPath = customPath;
  } else {
    const DATA_DIR = path.resolve(__dirname, '../data');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbPath = path.join(DATA_DIR, 'signs.db');
  }

  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS signs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      style_description TEXT NOT NULL,
      era TEXT NOT NULL,
      in_use INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sign_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(sign_id),
      FOREIGN KEY (sign_id) REFERENCES signs(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sign_tags (
      sign_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (sign_id, tag_id),
      FOREIGN KEY (sign_id) REFERENCES signs(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sign_id INTEGER NOT NULL,
      viewed_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(sign_id),
      FOREIGN KEY (sign_id) REFERENCES signs(id) ON DELETE CASCADE
    )
  `);

  return db;
}

const db = createDatabase(process.env.TEST_DB_PATH);

export default db;
