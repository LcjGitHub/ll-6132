/** 公交站牌记录 */
export interface BusSign {
  id: number;
  city: string;
  styleDescription: string;
  era: string;
  inUse: boolean;
  imageUrl: string;
}

/** 创建/更新站牌请求体 */
export interface BusSignInput {
  city: string;
  styleDescription: string;
  era: string;
  inUse: boolean;
  imageUrl: string;
}
