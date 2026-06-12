import axios from 'axios';
import type { BusSign, BusSignInput } from '@/types/sign';

const api = axios.create({
  baseURL: '/api',
});

/** 获取全部站牌 */
export async function fetchSigns(): Promise<BusSign[]> {
  const { data } = await api.get<BusSign[]>('/signs');
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
