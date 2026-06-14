import { Router, Request, Response } from 'express';
import db from '../db';
import type { BusSign, BusSignInput, Tag, PaginatedResponse } from '../types';

const router = Router();

interface DbRow {
  id: number;
  city: string;
  style_description: string;
  era: string;
  in_use: number;
  image_url: string;
}

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

/** 将数据库行映射为 API 响应对象（含标签） */
function rowToSign(row: DbRow, includeTags = true): BusSign {
  const sign: BusSign = {
    id: row.id,
    city: row.city,
    styleDescription: row.style_description,
    era: row.era,
    inUse: row.in_use === 1,
    imageUrl: row.image_url,
  };
  if (includeTags) {
    sign.tags = getTagsBySignId(row.id);
  }
  return sign;
}

function setSignTags(signId: number, tagIds: number[] | undefined) {
  db.prepare('DELETE FROM sign_tags WHERE sign_id = ?').run(signId);
  if (!tagIds || tagIds.length === 0) return;
  const uniqueIds = Array.from(new Set(tagIds));
  const insert = db.prepare('INSERT INTO sign_tags (sign_id, tag_id) VALUES (?, ?)');
  for (const tagId of uniqueIds) {
    const tagExists = db.prepare('SELECT id FROM tags WHERE id = ?').get(tagId);
    if (tagExists) {
      insert.run(signId, tagId);
    }
  }
}

const MAX_TAGS_PER_SIGN = 3;

function validateTagIds(tagIds: number[] | undefined): string | null {
  if (!tagIds || tagIds.length === 0) return null;
  if (tagIds.length > MAX_TAGS_PER_SIGN) {
    return `每条站牌最多绑定 ${MAX_TAGS_PER_SIGN} 个标签，当前提交了 ${tagIds.length} 个`;
  }
  return null;
}

function buildFilterWhereClause(
  query: Record<string, string | undefined>
): { joinClause: string; whereClause: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let joinClause = '';

  if (query.city && query.city.trim() !== '') {
    conditions.push('s.city = ?');
    params.push(query.city);
  }
  if (query.era && query.era.trim() !== '') {
    conditions.push('s.era = ?');
    params.push(query.era);
  }
  if (query.inUse !== undefined && query.inUse !== '') {
    const inUseVal = query.inUse === 'true' || query.inUse === '1' ? 1 : 0;
    conditions.push('s.in_use = ?');
    params.push(inUseVal);
  }
  if (query.tagId && query.tagId.trim() !== '') {
    const tagIdNum = Number(query.tagId);
    if (!Number.isNaN(tagIdNum) && tagIdNum > 0) {
      joinClause = 'INNER JOIN sign_tags st ON s.id = st.sign_id';
      conditions.push('st.tag_id = ?');
      params.push(tagIdNum);
    }
  }
  if (query.keyword && query.keyword.trim() !== '') {
    conditions.push('s.style_description LIKE ?');
    params.push(`%${query.keyword.trim()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { joinClause, whereClause, params };
}

function buildOrderClause(sortBy?: string, sortOrder?: string): string {
  const validSortFields = ['id', 'city', 'era'];
  let sortField = 'id';
  if (sortBy && validSortFields.includes(sortBy)) {
    sortField = sortBy;
  }
  const validSortOrders = ['asc', 'desc'];
  let order = 'asc';
  if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
    order = sortOrder.toLowerCase();
  }
  return `ORDER BY s.${sortField} ${order}`;
}

/** GET /api/signs — 获取站牌列表（支持筛选、排序、分页） */
router.get('/', (req: Request, res: Response) => {
  const { city, era, inUse, tagId, sortBy, sortOrder, page, pageSize, keyword } = req.query;

  const { joinClause, whereClause, params } = buildFilterWhereClause({
    city: typeof city === 'string' ? city : undefined,
    era: typeof era === 'string' ? era : undefined,
    inUse: inUse !== undefined ? String(inUse) : undefined,
    tagId: typeof tagId === 'string' ? tagId : undefined,
    keyword: typeof keyword === 'string' ? keyword : undefined,
  });
  const orderClause = buildOrderClause(
    typeof sortBy === 'string' ? sortBy : undefined,
    typeof sortOrder === 'string' ? sortOrder : undefined
  );

  const usePagination = page !== undefined && pageSize !== undefined;

  if (usePagination) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    const countSql = `SELECT COUNT(DISTINCT s.id) AS total FROM signs s ${joinClause} ${whereClause}`;
    const countRow = db.prepare(countSql).get(...params) as { total: number };
    const total = countRow.total;

    const dataSql = `SELECT DISTINCT s.* FROM signs s ${joinClause} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const dataParams = [...params, pageSizeNum, offset];
    const rows = db.prepare(dataSql).all(...dataParams) as DbRow[];

    const response: PaginatedResponse<BusSign> = {
      items: rows.map((r) => rowToSign(r, true)),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
    res.json(response);
  } else {
    const sql = `SELECT DISTINCT s.* FROM signs s ${joinClause} ${whereClause} ${orderClause}`;
    const rows = db.prepare(sql).all(...params) as DbRow[];
    res.json(rows.map((r) => rowToSign(r, true)));
  }
});

/** GET /api/signs/export — 导出站牌数据为 CSV 文件 */
router.get('/export', (req: Request, res: Response) => {
  const { city, era, inUse, tagId, sortBy, sortOrder, keyword } = req.query;

  const { joinClause, whereClause, params } = buildFilterWhereClause({
    city: typeof city === 'string' ? city : undefined,
    era: typeof era === 'string' ? era : undefined,
    inUse: inUse !== undefined ? String(inUse) : undefined,
    tagId: typeof tagId === 'string' ? tagId : undefined,
    keyword: typeof keyword === 'string' ? keyword : undefined,
  });
  const orderClause = buildOrderClause(
    typeof sortBy === 'string' ? sortBy : undefined,
    typeof sortOrder === 'string' ? sortOrder : undefined
  );

  const dataSql = `SELECT DISTINCT s.* FROM signs s ${joinClause} ${whereClause} ${orderClause}`;
  const rows = db.prepare(dataSql).all(...params) as DbRow[];

  const csvHeader = '编号,城市,样式描述,年代,是否使用中,图片地址,标签名称';
  const csvRows = rows.map((row) => {
    const sign = rowToSign(row, true);
    const tagNames = (sign.tags || []).map((t) => t.name).join('|');
    return [
      sign.id,
      csvEscape(sign.city),
      csvEscape(sign.styleDescription),
      csvEscape(sign.era),
      sign.inUse ? '是' : '否',
      csvEscape(sign.imageUrl),
      csvEscape(tagNames),
    ].join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + csvHeader + '\n' + csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="signs_export.csv"');
  res.send(csv);
});

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

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
  res.json(rows.map((r) => rowToSign(r, true)));
});

/** GET /api/signs/ids — 获取全部站牌编号有序列表（按 id 升序） */
router.get('/ids', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT id FROM signs ORDER BY id ASC').all() as { id: number }[];
  res.json(rows.map((r) => r.id));
});

/** GET /api/signs/random — 获取随机站牌 */
router.get('/random', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM signs ORDER BY RANDOM() LIMIT 1').get() as DbRow | undefined;
  if (!row) {
    res.status(404).json({ error: '暂无站牌数据' });
    return;
  }
  res.json(rowToSign(row, true));
});

/** GET /api/signs/:id — 获取单条站牌 */
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(req.params.id) as DbRow | undefined;
  if (!row) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }
  res.json(rowToSign(row, true));
});

/** POST /api/signs — 新建站牌 */
router.post('/', (req: Request, res: Response) => {
  const body = req.body as BusSignInput;
  if (!body.city || !body.styleDescription || !body.era || !body.imageUrl) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const tagError = validateTagIds(body.tagIds);
  if (tagError) {
    res.status(400).json({ error: tagError });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO signs (city, style_description, era, in_use, image_url)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(body.city, body.styleDescription, body.era, body.inUse ? 1 : 0, body.imageUrl);

  const signId = result.lastInsertRowid as number;
  setSignTags(signId, body.tagIds);

  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(signId) as DbRow;
  res.status(201).json(rowToSign(row, true));
});

/** PUT /api/signs/:id — 更新站牌 */
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM signs WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '站牌不存在' });
    return;
  }

  const body = req.body as BusSignInput;
  const tagError = validateTagIds(body.tagIds);
  if (tagError) {
    res.status(400).json({ error: tagError });
    return;
  }

  db.prepare(
    `UPDATE signs SET city = ?, style_description = ?, era = ?, in_use = ?, image_url = ?
     WHERE id = ?`
  ).run(body.city, body.styleDescription, body.era, body.inUse ? 1 : 0, body.imageUrl, req.params.id);

  setSignTags(Number(req.params.id), body.tagIds);

  const row = db.prepare('SELECT * FROM signs WHERE id = ?').get(req.params.id) as DbRow;
  res.json(rowToSign(row, true));
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
