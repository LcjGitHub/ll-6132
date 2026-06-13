import { Router, Request, Response } from 'express';
import db from '../db';
import type { CityStats } from '../types';

const router = Router();

interface DbRow {
  city: string;
  total: number;
  in_use: number;
}

function rowToStats(row: DbRow): CityStats {
  return {
    city: row.city,
    total: row.total,
    inUse: row.in_use,
  };
}

/** GET /api/stats/cities — 按城市汇总站牌总数和使用中数量 */
router.get('/cities', (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT
         city,
         COUNT(*) AS total,
         SUM(CASE WHEN in_use = 1 THEN 1 ELSE 0 END) AS in_use
       FROM signs
       GROUP BY city
       ORDER BY total DESC, city ASC`
    )
    .all() as DbRow[];

  res.json(rows.map(rowToStats));
});

export default router;
