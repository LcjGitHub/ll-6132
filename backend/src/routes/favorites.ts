import { Router, Request, Response } from 'express';
import db from '../db';
import type { FavoriteWithSign } from '../types';

const router = Router();

interface FavoriteDbRow {
  id: number;
  sign_id: number;
  created_at: string;
  city: string;
  style_description: string;
  era: string;
  in_use: number;
  image_url: string;
}

function rowToFavoriteWithSign(row: FavoriteDbRow): FavoriteWithSign {
  return {
    id: row.id,
    signId: row.sign_id,
    createdAt: row.created_at,
    sign: {
      id: row.sign_id,
      city: row.city,
      styleDescription: row.style_description,
      era: row.era,
      inUse: row.in_use === 1,
      imageUrl: row.image_url,
    },
  };
}

/** POST /api/favorites — 添加收藏 */
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

  const existingFav = db.prepare('SELECT id FROM favorites WHERE sign_id = ?').get(signId);
  if (existingFav) {
    res.status(409).json({ error: '该站牌已收藏' });
    return;
  }

  const result = db
    .prepare('INSERT INTO favorites (sign_id) VALUES (?)')
    .run(signId);

  const row = db
    .prepare(`
      SELECT f.id, f.sign_id, f.created_at,
             s.city, s.style_description, s.era, s.in_use, s.image_url
      FROM favorites f
      JOIN signs s ON f.sign_id = s.id
      WHERE f.id = ?
    `)
    .get(result.lastInsertRowid) as FavoriteDbRow;

  res.status(201).json(rowToFavoriteWithSign(row));
});

/** DELETE /api/favorites/:signId — 取消收藏 */
router.delete('/:signId', (req: Request, res: Response) => {
  const signId = Number(req.params.signId);
  if (isNaN(signId)) {
    res.status(400).json({ error: '无效的 signId' });
    return;
  }

  const result = db.prepare('DELETE FROM favorites WHERE sign_id = ?').run(signId);
  if (result.changes === 0) {
    res.status(404).json({ error: '收藏记录不存在' });
    return;
  }
  res.status(204).send();
});

/** GET /api/favorites — 查询收藏列表（含站牌详情） */
router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare(`
      SELECT f.id, f.sign_id, f.created_at,
             s.city, s.style_description, s.era, s.in_use, s.image_url
      FROM favorites f
      JOIN signs s ON f.sign_id = s.id
      ORDER BY f.created_at DESC
    `)
    .all() as FavoriteDbRow[];

  res.json(rows.map(rowToFavoriteWithSign));
});

interface CheckDbRow {
  id: number;
  created_at: string;
}

/** GET /api/favorites/check/:signId — 检查某个站牌是否已收藏 */
router.get('/check/:signId', (req: Request, res: Response) => {
  const signId = Number(req.params.signId);
  if (isNaN(signId)) {
    res.status(400).json({ error: '无效的 signId' });
    return;
  }

  const row = db.prepare('SELECT id, created_at FROM favorites WHERE sign_id = ?').get(signId) as CheckDbRow | undefined;
  if (row) {
    res.json({ favorited: true, createdAt: row.created_at });
  } else {
    res.json({ favorited: false });
  }
});

export default router;
