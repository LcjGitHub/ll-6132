/** 标签 */
export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
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

/** 排序字段 */
export type SortField = 'id' | 'city' | 'era';

/** 排序方向 */
export type SortOrder = 'asc' | 'desc';

/** 站牌筛选条件 */
export interface SignFilters {
  city?: string;
  era?: string;
  inUse?: boolean;
  tagId?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 城市站牌统计数据 */
export interface CityStats {
  city: string;
  total: number;
  inUse: number;
}

/** 收藏记录（含站牌详情） */
export interface FavoriteWithSign {
  id: number;
  signId: number;
  createdAt: string;
  sign: BusSign;
}

/** 收藏检查结果 */
export interface FavoriteCheckResult {
  favorited: boolean;
  createdAt?: string;
}
