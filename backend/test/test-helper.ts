import fs from 'fs';
import path from 'path';
import db from '../src/db';
import { seedDatabase } from '../src/seed';
import { createApp } from '../src/app';
import request from 'supertest';

export { db };

export const app = createApp();

export function resetDatabase() {
  db.exec(`
    DELETE FROM sign_tags;
    DELETE FROM favorites;
    DELETE FROM signs;
    DELETE FROM tags;
    DELETE FROM sqlite_sequence WHERE name IN ('signs', 'favorites', 'tags');
  `);
  seedDatabase(db, true);
}

beforeEach(() => {
  resetDatabase();
});

afterAll(() => {
  db.close();
  const testDbPath = (global as any).__TEST_DB_PATH__;
  const tmpDir = (global as any).__TEST_TMP_DIR__;
  if (testDbPath && fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (e) { /* ignore */ }
  }
  if (tmpDir && fs.existsSync(tmpDir)) {
    try { fs.rmdirSync(tmpDir); } catch (e) { /* ignore */ }
  }
});

export function testRequest() {
  return request(app);
}
