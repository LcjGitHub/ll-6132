import axios from 'axios';
import type { BusSign, BusSignInput, SignFilters, CityStats } from '@/types/sign';

const api = axios.create({
  baseURL: '/api',
});

/** 获取站牌列表（支持按条件筛选） */
export async function fetchSigns(filters?: SignFilters): Promise<BusSign[]> {
  const params: Record<string, string | boolean> = {};
  if (filters?.city) params.city = filters.city;
  if (filters?.era) params.era = filters.era;
  if (filters?.inUse !== null && filters?.inUse !== undefined) {
    params.inUse = filters.inUse;
  }
  const { data } = await api.get<BusSign[]>('/signs', { params });
  return data;
}

/** 获取单条站牌 */
export async function fetchSign(id: number): Promise<BusSign> {
  const { data } = await api.get<BusSign>(`/signs/${id}`);
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

/** 获取按城市汇总的统计数据 */
export async function fetchCityStats(): Promise<CityStats[]> {
  const { data } = await api.get<CityStats[]>('/stats/cities');
  return data;
}
