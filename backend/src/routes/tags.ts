import { Router, Request, Response } from 'express';
import db from '../db';
import type { Tag, TagInput } from '../types';

const router = Router();

interface DbTagRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

function rowToTag(row: DbTagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

function getTagsBySignId(signId: number): Tag[] {
  const rows = db
    .prepare(
      `SELECT t.* FROM tags t
       INNER JOIN sign_tags st ON t.id = st.tag_id
       WHERE st.sign_id = ?
       ORDER BY t.id`
    )
    .all(signId) as DbTagRow[];
  return rows.map(rowToTag);
}

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY id').all() as DbTagRow[];
  res.json(rows.map(rowToTag));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as DbTagRow | undefined;
  if (!row) {
    res.status(404).json({ error: '标签不存在' });
    return;
  }
  res.json(rowToTag(row));
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as TagInput;
  if (!body.name || body.name.trim() === '') {
    res.status(400).json({ error: '缺少标签名称' });
    return;
  }
  const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(body.name.trim());
  if (existing) {
    res.status(409).json({ error: '标签名称已存在' });
    return;
  }
  const color = body.color || 'info';
  const result = db
    .prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
    .run(body.name.trim(), color);
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid) as DbTagRow;
  res.status(201).json(rowToTag(row));
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as DbTagRow | undefined;
  if (!existing) {
    res.status(404).json({ error: '标签不存在' });
    return;
  }
  const body = req.body as TagInput;
  const name = body.name?.trim() || existing.name;
  const color = body.color || existing.color;
  const duplicate = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(name, req.params.id);
  if (duplicate) {
    res.status(409).json({ error: '标签名称已存在' });
    return;
  }
  db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(name, color, req.params.id);
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as DbTagRow;
  res.json(rowToTag(row));
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '标签不存在' });
    return;
  }
  db.prepare('DELETE FROM sign_tags WHERE tag_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export { router as tagsRouter, getTagsBySignId };
