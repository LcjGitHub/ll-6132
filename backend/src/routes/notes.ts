import { Router, Request, Response } from 'express';
import db from '../db';
import type { SignNote, SignNoteInput } from '../types';

const router = Router();

const MAX_CONTENT_LENGTH = 200;

interface NoteDbRow {
  id: number;
  sign_id: number;
  content: string;
  updated_at: string;
}

function rowToNote(row: NoteDbRow): SignNote {
  return {
    id: row.id,
    signId: row.sign_id,
    content: row.content,
    updatedAt: row.updated_at,
  };
}

/** GET /api/notes/:signId — 获取某站牌的备注 */
router.get('/:signId', (req: Request, res: Response) => {
  const signId = Number(req.params.signId);
  if (Number.isNaN(signId)) {
    res.status(400).json({ error: '无效的 signId' });
    return;
  }

  const existingSign = db.prepare('SELECT id FROM signs WHERE id = ?').get(signId);
  if (!existingSign) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }

  const row = db.prepare('SELECT * FROM sign_notes WHERE sign_id = ?').get(signId) as NoteDbRow | undefined;
  if (!row) {
    res.json({ id: 0, signId, content: '', updatedAt: '' });
    return;
  }
  res.json(rowToNote(row));
});

/** POST /api/notes — 为某站牌创建备注 */
router.post('/', (req: Request, res: Response) => {
  const { signId, content } = req.body as { signId: number; content: string };
  if (!signId || typeof signId !== 'number') {
    res.status(400).json({ error: '缺少或无效的 signId' });
    return;
  }
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'content 必须为字符串' });
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(400).json({ error: `备注内容不能超过 ${MAX_CONTENT_LENGTH} 字` });
    return;
  }

  const existingSign = db.prepare('SELECT id FROM signs WHERE id = ?').get(signId);
  if (!existingSign) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }

  const existingNote = db.prepare('SELECT id FROM sign_notes WHERE sign_id = ?').get(signId);
  if (existingNote) {
    res.status(409).json({ error: '该站牌已有备注，请使用 PUT 更新' });
    return;
  }

  const result = db
    .prepare('INSERT INTO sign_notes (sign_id, content) VALUES (?, ?)')
    .run(signId, content);

  const row = db.prepare('SELECT * FROM sign_notes WHERE id = ?').get(result.lastInsertRowid) as NoteDbRow;
  res.status(201).json(rowToNote(row));
});

/** PUT /api/notes/:signId — 更新某站牌的备注 */
router.put('/:signId', (req: Request, res: Response) => {
  const signId = Number(req.params.signId);
  if (Number.isNaN(signId)) {
    res.status(400).json({ error: '无效的 signId' });
    return;
  }

  const { content } = req.body as SignNoteInput;
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'content 必须为字符串' });
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(400).json({ error: `备注内容不能超过 ${MAX_CONTENT_LENGTH} 字` });
    return;
  }

  const existing = db.prepare('SELECT id FROM sign_notes WHERE sign_id = ?').get(signId) as NoteDbRow | undefined;
  if (!existing) {
    const existingSign = db.prepare('SELECT id FROM signs WHERE id = ?').get(signId);
    if (!existingSign) {
      res.status(404).json({ error: '站牌不存在' });
      return;
    }

    const result = db
      .prepare('INSERT INTO sign_notes (sign_id, content) VALUES (?, ?)')
      .run(signId, content);

    const row = db.prepare('SELECT * FROM sign_notes WHERE id = ?').get(result.lastInsertRowid) as NoteDbRow;
    res.status(201).json(rowToNote(row));
    return;
  }

  db.prepare(
    "UPDATE sign_notes SET content = ?, updated_at = datetime('now', 'localtime') WHERE sign_id = ?"
  ).run(content, signId);

  const row = db.prepare('SELECT * FROM sign_notes WHERE sign_id = ?').get(signId) as NoteDbRow;
  res.json(rowToNote(row));
});

/** DELETE /api/notes/:signId — 删除某站牌的备注 */
router.delete('/:signId', (req: Request, res: Response) => {
  const signId = Number(req.params.signId);
  if (Number.isNaN(signId)) {
    res.status(400).json({ error: '无效的 signId' });
    return;
  }

  const result = db.prepare('DELETE FROM sign_notes WHERE sign_id = ?').run(signId);
  if (result.changes === 0) {
    res.status(404).json({ error: '备注不存在' });
    return;
  }
  res.status(204).send();
});

export default router;
