import type { DbInstance } from './db';
import db from './db';

export const SEED_DATA = [
  {
    province: '北京市',
    city: '北京',
    styleDescription: '蓝白配色立柱式站牌，顶部公交图标，线路信息横向排列，采用 LED 背光',
    era: '2010年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop',
    tagNames: ['立柱式', '电子屏'],
  },
  {
    province: '上海市',
    city: '上海',
    styleDescription: '绿色圆角矩形站牌，双语（中英）标识，线路编号大号字体突出',
    era: '2000年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-e097023a06d0?w=600&h=400&fit=crop',
    tagNames: ['立柱式'],
  },
  {
    province: '四川省',
    city: '成都',
    styleDescription: '熊猫元素装饰的仿古木质站牌，融合巴蜀文化，线路信息竖排展示',
    era: '1990年代',
    inUse: false,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    tagNames: ['仿古风', '立柱式'],
  },
  {
    province: '广东省',
    city: '广州',
    styleDescription: '不锈钢框架玻璃面板，电子墨水屏显示到站信息，夜间自发光',
    era: '2020年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
    tagNames: ['电子屏', '立柱式'],
  },
  {
    province: '陕西省',
    city: '西安',
    styleDescription: '仿唐风飞檐顶盖站牌，朱红立柱，线路牌嵌入仿古灯笼造型灯箱',
    era: '1980年代',
    inUse: false,
    imageUrl: 'https://images.unsplash.com/photo-1477959856237-f9db59b91a9d?w=600&h=400&fit=crop',
    tagNames: ['仿古风'],
  },
];

export const PRESET_TAGS = [
  { name: '立柱式', color: 'primary' },
  { name: '仿古风', color: 'warning' },
  { name: '电子屏', color: 'info' },
  { name: '挂墙式', color: 'success' },
  { name: '候车亭', color: 'help' },
];

export function seedDatabase(database: DbInstance, force = false): { signs: number; tags: number } {
  let insertedTags = 0;
  let insertedSigns = 0;

  const tagCount = database.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
  if (force || tagCount.count === 0) {
    if (force) database.exec('DELETE FROM sign_tags; DELETE FROM tags;');
    const insertTag = database.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
    for (const tag of PRESET_TAGS) {
      insertTag.run(tag.name, tag.color);
      insertedTags++;
    }
  }

  const count = database.prepare('SELECT COUNT(*) as count FROM signs').get() as { count: number };
  if (force || count.count === 0) {
    if (force) database.exec('DELETE FROM sign_tags; DELETE FROM signs; DELETE FROM favorites;');
    const insertSign = database.prepare(`
      INSERT INTO signs (province, city, style_description, era, in_use, image_url)
      VALUES (@province, @city, @styleDescription, @era, @inUse, @imageUrl)
    `);
    const insertSignTag = database.prepare('INSERT INTO sign_tags (sign_id, tag_id) VALUES (?, ?)');
    const getTagId = database.prepare('SELECT id FROM tags WHERE name = ?');

    const insertMany = database.transaction((items: typeof SEED_DATA) => {
      for (const item of items) {
        const result = insertSign.run({ ...item, inUse: item.inUse ? 1 : 0 });
        const signId = result.lastInsertRowid as number;
        for (const tagName of item.tagNames) {
          const tag = getTagId.get(tagName) as { id: number } | undefined;
          if (tag) {
            insertSignTag.run(signId, tag.id);
          }
        }
        insertedSigns++;
      }
    });

    insertMany(SEED_DATA);
  }

  return { signs: insertedSigns, tags: insertedTags };
}

if (require.main === undefined || !process.env.DISABLE_AUTO_SEED) {
  seedDatabase(db);
}
