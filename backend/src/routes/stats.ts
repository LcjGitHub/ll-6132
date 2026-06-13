import { Router, Request, Response } from 'express';
import db from '../db';
import type { CityStats, EraStats, StatsResponse } from '../types';

const router = Router();

interface CityDbRow {
  city: string;
  total: number;
  in_use: number;
}

interface EraDbRow {
  era: string;
  total: number;
  in_use: number;
}

function cityRowToStats(row: CityDbRow): CityStats {
  return {
    city: row.city,
    total: row.total,
    inUse: row.in_use,
  };
}

function eraRowToStats(row: EraDbRow): EraStats {
  return {
    era: row.era,
    total: row.total,
    inUse: row.in_use,
  };
}

function getCityStats(): CityStats[] {
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
    .all() as CityDbRow[];
  return rows.map(cityRowToStats);
}

function getEraStats(): EraStats[] {
  const rows = db
    .prepare(
      `SELECT
         era,
         COUNT(*) AS total,
         SUM(CASE WHEN in_use = 1 THEN 1 ELSE 0 END) AS in_use
       FROM signs
       GROUP BY era
       ORDER BY era ASC`
    )
    .all() as EraDbRow[];
  return rows.map(eraRowToStats);
}

/** GET /api/stats — 获取综合统计数据（城市+年代分布） */
router.get('/', (_req: Request, res: Response) => {
  const response: StatsResponse = {
    cities: getCityStats(),
    eras: getEraStats(),
  };
  res.json(response);
});

/** GET /api/stats/cities — 按城市汇总站牌总数和使用中数量 */
router.get('/cities', (_req: Request, res: Response) => {
  res.json(getCityStats());
});

/** GET /api/stats/eras — 按年代汇总站牌总数和使用中数量 */
router.get('/eras', (_req: Request, res: Response) => {
  res.json(getEraStats());
});

export default router;
