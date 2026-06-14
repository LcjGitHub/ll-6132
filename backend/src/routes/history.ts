import { Router, Request, Response } from 'express';
import db from '../db';
import type { HistoryWithSign } from '../types';

const router = Router();

const MAX_HISTORY = 20;

interface HistoryDbRow {
  id: number;
  sign_id: number;
  viewed_at: string;
  province: string;
  city: string;
  style_description: string;
  era: string;
  in_use: number;
  image_url: string;
}

function rowToHistoryWithSign(row: HistoryDbRow): HistoryWithSign {
  return {
    id: row.id,
    signId: row.sign_id,
    viewedAt: row.viewed_at,
    sign: {
      id: row.sign_id,
      province: row.province,
      city: row.city,
      styleDescription: row.style_description,
      era: row.era,
      inUse: row.in_use === 1,
      imageUrl: row.image_url,
    },
  };
}

/** POST /api/history — 记录浏览历史，同站牌重复浏览只更新时间 */
router.post('/', (req: Request, res: Response) => {
  const { signId } = req.body as { signId: number };
  if (!signId || typeof signId !== 'number') {
    res.status(400).json({ error: '缺少或无效的 signId' });
    return;
  }

  const existingSign = db.prepare('SELECT id FROM signs WHERE id = ?').get(signId);
  if (!existingSign) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }

  db.prepare(`
    INSERT INTO history (sign_id, viewed_at)
    VALUES (?, datetime('now', 'localtime'))
    ON CONFLICT(sign_id) DO UPDATE SET
      viewed_at = datetime('now', 'localtime')
  `).run(signId);

  const total = (db.prepare('SELECT COUNT(*) AS count FROM history').get() as { count: number }).count;
  if (total > MAX_HISTORY) {
    db.prepare(`
      DELETE FROM history
      WHERE id NOT IN (
        SELECT id FROM history
        ORDER BY viewed_at DESC
        LIMIT ?
      )
    `).run(MAX_HISTORY);
  }

  const row = db.prepare(`
    SELECT h.id, h.sign_id, h.viewed_at,
           s.province, s.city, s.style_description, s.era, s.in_use, s.image_url
    FROM history h
    JOIN signs s ON h.sign_id = s.id
    WHERE h.sign_id = ?
  `).get(signId) as HistoryDbRow;

  res.status(201).json(rowToHistoryWithSign(row));
});

/** GET /api/history — 获取浏览历史列表（含站牌详情，按时间倒序，最多20条） */
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT h.id, h.sign_id, h.viewed_at,
           s.province, s.city, s.style_description, s.era, s.in_use, s.image_url
    FROM history h
    JOIN signs s ON h.sign_id = s.id
    ORDER BY h.viewed_at DESC
    LIMIT ?
  `).all(MAX_HISTORY) as HistoryDbRow[];

  res.json(rows.map(rowToHistoryWithSign));
});

/** DELETE /api/history — 清空全部浏览历史 */
router.delete('/', (_req: Request, res: Response) => {
  db.prepare('DELETE FROM history').run();
  res.status(204).send();
});

export default router;
