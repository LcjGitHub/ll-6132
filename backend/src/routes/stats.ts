import { Router, Request, Response } from 'express';
import db from '../db';
import type { CityStats, EraStats, TagStats, StatsResponse } from '../types';

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

interface TagDbRow {
  tag_id: number;
  tag_name: string;
  tag_color: string;
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

function tagRowToStats(row: TagDbRow): TagStats {
  return {
    tagId: row.tag_id,
    tagName: row.tag_name,
    tagColor: row.tag_color,
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

function getTagStats(): TagStats[] {
  const rows = db
    .prepare(
      `SELECT
         t.id AS tag_id,
         t.name AS tag_name,
         t.color AS tag_color,
         COUNT(st.sign_id) AS total,
         SUM(CASE WHEN s.in_use = 1 THEN 1 ELSE 0 END) AS in_use
       FROM tags t
       LEFT JOIN sign_tags st ON t.id = st.tag_id
       LEFT JOIN signs s ON st.sign_id = s.id
       GROUP BY t.id, t.name, t.color
       ORDER BY total DESC, t.name ASC`
    )
    .all() as TagDbRow[];
  return rows.map(tagRowToStats);
}

/** GET /api/stats — 获取综合统计数据（城市+年代+标签分布） */
router.get('/', (_req: Request, res: Response) => {
  const response: StatsResponse = {
    cities: getCityStats(),
    eras: getEraStats(),
    tags: getTagStats(),
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

/** GET /api/stats/tags — 按标签汇总站牌总数和使用中数量 */
router.get('/tags', (_req: Request, res: Response) => {
  res.json(getTagStats());
});

export default router;
