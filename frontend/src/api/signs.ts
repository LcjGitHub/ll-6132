import axios from 'axios';
import type {
  BusSign,
  BusSignInput,
  SignFilters,
  CityStats,
  EraStats,
  StatsResponse,
  FavoriteWithSign,
  FavoriteCheckResult,
  Tag,
  PaginatedResponse,
  HistoryWithSign,
  SignNote,
} from '@/types/sign';

const api = axios.create({
  baseURL: '/api',
});

function buildFilterParams(filters?: SignFilters): Record<string, string | boolean | number> {
  const params: Record<string, string | boolean | number> = {};
  if (filters?.city) params.city = filters.city;
  if (filters?.era) params.era = filters.era;
  if (filters?.inUse !== null && filters?.inUse !== undefined) {
    params.inUse = filters.inUse;
  }
  if (filters?.tagId !== null && filters?.tagId !== undefined) {
    params.tagId = filters.tagId;
  }
  if (filters?.keyword) params.keyword = filters.keyword;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
  return params;
}

/** 获取站牌列表（支持按条件筛选和排序，返回全部数据） */
export async function fetchSigns(filters?: SignFilters): Promise<BusSign[]> {
  const params = buildFilterParams(filters);
  const { data } = await api.get<BusSign[]>('/signs', { params });
  return data;
}

/** 获取分页站牌列表 */
export async function fetchSignsPaginated(
  page: number,
  pageSize: number,
  filters?: SignFilters
): Promise<PaginatedResponse<BusSign>> {
  const params = buildFilterParams(filters);
  params.page = page;
  params.pageSize = pageSize;
  const { data } = await api.get<PaginatedResponse<BusSign>>('/signs', { params });
  return data;
}

/** 获取全部标签 */
export async function fetchTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>('/tags');
  return data;
}

/** 创建标签 */
export async function createTag(input: { name: string; color?: string }): Promise<Tag> {
  const { data } = await api.post<Tag>('/tags', input);
  return data;
}

/** 获取单条站牌 */
export async function fetchSign(id: number): Promise<BusSign> {
  const { data } = await api.get<BusSign>(`/signs/${id}`);
  return data;
}

/** 按编号批量获取站牌 */
export async function fetchSignsBatch(ids: number[]): Promise<BusSign[]> {
  const { data } = await api.get<BusSign[]>('/signs/batch', {
    params: { ids: ids.join(',') },
  });
  return data;
}

/** 获取全部站牌编号有序列表（按 id 升序） */
export async function fetchSignIds(): Promise<number[]> {
  const { data } = await api.get<number[]>('/signs/ids');
  return data;
}

/** 获取随机站牌 */
export async function fetchRandomSign(): Promise<BusSign> {
  const { data } = await api.get<BusSign>('/signs/random');
  return data;
}

/** 新建站牌 */
export async function createSign(input: BusSignInput): Promise<BusSign> {
  const { data } = await api.post<BusSign>('/signs', input);
  return data;
}

/** 更新站牌 */
export async function updateSign(id: number, input: BusSignInput): Promise<BusSign> {
  const { data } = await api.put<BusSign>(`/signs/${id}`, input);
  return data;
}

/** 删除站牌 */
export async function deleteSign(id: number): Promise<void> {
  await api.delete(`/signs/${id}`);
}

/** 获取综合统计数据（城市+年代分布） */
export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>('/stats');
  return data;
}

/** 获取按城市汇总的统计数据 */
export async function fetchCityStats(): Promise<CityStats[]> {
  const { data } = await api.get<CityStats[]>('/stats/cities');
  return data;
}

/** 获取按年代汇总的统计数据 */
export async function fetchEraStats(): Promise<EraStats[]> {
  const { data } = await api.get<EraStats[]>('/stats/eras');
  return data;
}

/** 获取收藏列表（含站牌详情） */
export async function fetchFavorites(): Promise<FavoriteWithSign[]> {
  const { data } = await api.get<FavoriteWithSign[]>('/favorites');
  return data;
}

/** 添加收藏 */
export async function addFavorite(signId: number): Promise<FavoriteWithSign> {
  const { data } = await api.post<FavoriteWithSign>('/favorites', { signId });
  return data;
}

/** 取消收藏 */
export async function removeFavorite(signId: number): Promise<void> {
  await api.delete(`/favorites/${signId}`);
}

/** 检查某个站牌是否已收藏 */
export async function checkFavorite(signId: number): Promise<FavoriteCheckResult> {
  const { data } = await api.get<FavoriteCheckResult>(`/favorites/check/${signId}`);
  return data;
}

/** 获取浏览历史列表（含站牌详情） */
export async function fetchHistory(): Promise<HistoryWithSign[]> {
  const { data } = await api.get<HistoryWithSign[]>('/history');
  return data;
}

/** 记录浏览历史 */
export async function addHistory(signId: number): Promise<HistoryWithSign> {
  const { data } = await api.post<HistoryWithSign>('/history', { signId });
  return data;
}

/** 清空全部浏览历史 */
export async function clearHistory(): Promise<void> {
  await api.delete('/history');
}

/** 获取某站牌的备注 */
export async function fetchNote(signId: number): Promise<SignNote> {
  const { data } = await api.get<SignNote>(`/notes/${signId}`);
  return data;
}

/** 保存某站牌的备注（创建或更新） */
export async function saveNote(signId: number, content: string): Promise<SignNote> {
  const { data } = await api.put<SignNote>(`/notes/${signId}`, { content });
  return data;
}

/** 删除某站牌的备注 */
export async function deleteNote(signId: number): Promise<void> {
  await api.delete(`/notes/${signId}`);
}
