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

/** 城市站牌统计数据 */
export interface CityStats {
  city: string;
  total: number;
  inUse: number;
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
