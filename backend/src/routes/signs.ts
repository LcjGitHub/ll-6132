import { Router, Request, Response } from 'express';
import db from '../db';
import type { BusSign, BusSignInput } from '../types';

const router = Router();

interface DbRow {
  id: number;
  city: string;
  style_description: string;
  era: string;
  in_use: number;
  image_url: string;
}

/** 将数据库行映射为 API 响应对象 */
function rowToSign(row: DbRow): BusSign {
  return {
    id: row.id,
    city: row.city,
    styleDescription: row.style_description,
    era: row.era,
    inUse: row.in_use === 1,
    imageUrl: row.image_url,
  };
}

/** GET /api/signs — 获取全部站牌（支持按城市、年代、使用状态筛选） */
router.get('/', (req: Request, res: Response) => {
  const { city, era, inUse } = req.query;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (typeof city === 'string' && city.trim() !== '') {
    conditions.push('city = ?');
    params.push(city);
  }
  if (typeof era === 'string' && era.trim() !== '') {
    conditions.push('era = ?');
    params.push(era);
  }
  if (inUse !== undefined && inUse !== '') {
    const inUseVal = inUse === 'true' || inUse === '1' ? 1 : 0;
    conditions.push('in_use = ?');
    params.push(inUseVal);
  }

  const sql = conditions.length > 0
    ? `SELECT * FROM signs WHERE ${conditions.join(' AND ')} ORDER BY id`
    : 'SELECT * FROM signs ORDER BY id';

  const rows = db.prepare(sql).all(...params) as DbRow[];
  res.json(rows.map(rowToSign));
});

/** GET /api/signs/batch — 按编号批量查询站牌详情 */
router.get('/batch', (req: Request, res: Response) => {
  const { ids } = req.query;
  if (typeof ids !== 'string' || ids.trim() === '') {
    res.status(400).json({ error: '缺少 ids 参数' });
    return;
  }
  const idList = ids
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (idList.length === 0) {
    res.status(400).json({ error: 'ids 参数格式错误' });
    return;
  }
  const placeholders = idList.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT * FROM signs WHERE id IN (${placeholders}) ORDER BY id`)
    .all(...idList) as DbRow[];
  res.json(rows.map(rowToSign));
});

/** GET /api/signs/:id — 获取单条站牌 */
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(req.params.id) as DbRow | undefined;
  if (!row) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }
  res.json(rowToSign(row));
});

/** POST /api/signs — 新建站牌 */
router.post('/', (req: Request, res: Response) => {
  const body = req.body as BusSignInput;
  if (!body.city || !body.styleDescription || !body.era || !body.imageUrl) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO signs (city, style_description, era, in_use, image_url)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(body.city, body.styleDescription, body.era, body.inUse ? 1 : 0, body.imageUrl);

  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(result.lastInsertRowid) as DbRow;
  res.status(201).json(rowToSign(row));
});

/** PUT /api/signs/:id — 更新站牌 */
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM signs WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }

  const body = req.body as BusSignInput;
  db.prepare(
    `UPDATE signs SET city = ?, style_description = ?, era = ?, in_use = ?, image_url = ?
     WHERE id = ?`
  ).run(body.city, body.styleDescription, body.era, body.inUse ? 1 : 0, body.imageUrl, req.params.id);

  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(req.params.id) as DbRow;
  res.json(rowToSign(row));
});

/** DELETE /api/signs/:id — 删除站牌 */
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM signs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }
  res.status(204).send();
});

export default router;
