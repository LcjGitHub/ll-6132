/** 标签 */
export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

/** 创建标签请求体 */
export interface TagInput {
  name: string;
  color?: string;
}

/** 公交站牌记录 */
export interface BusSign {
  id: number;
  city: string;
  styleDescription: string;
  era: string;
  inUse: boolean;
  imageUrl: string;
  tags?: Tag[];
}

/** 创建/更新站牌请求体 */
export interface BusSignInput {
  city: string;
  styleDescription: string;
  era: string;
  inUse: boolean;
  imageUrl: string;
  tagIds?: number[];
}

/** 城市站牌统计数据 */
export interface CityStats {
  city: string;
  total: number;
  inUse: number;
}

/** 年代站牌统计数据 */
export interface EraStats {
  era: string;
  total: number;
  inUse: number;
}

/** 综合统计响应 */
export interface StatsResponse {
  cities: CityStats[];
  eras: EraStats[];
}

/** 收藏记录 */
export interface Favorite {
  id: number;
  signId: number;
  createdAt: string;
  sign?: BusSign;
}

/** 收藏记录（包含站牌详情） */
export interface FavoriteWithSign extends Favorite {
  sign: BusSign;
}

/** 浏览历史记录 */
export interface HistoryRecord {
  id: number;
  signId: number;
  viewedAt: string;
  sign?: BusSign;
}

/** 浏览历史记录（包含站牌详情） */
export interface HistoryWithSign extends HistoryRecord {
  sign: BusSign;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
