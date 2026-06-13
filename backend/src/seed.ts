import db from './db';

const SEED_DATA = [
  {
    city: '北京',
    styleDescription: '蓝白配色立柱式站牌，顶部公交图标，线路信息横向排列，采用 LED 背光',
    era: '2010年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop',
    tagNames: ['立柱式', '电子屏'],
  },
  {
    city: '上海',
    styleDescription: '绿色圆角矩形站牌，双语（中英）标识，线路编号大号字体突出',
    era: '2000年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-e097023a06d0?w=600&h=400&fit=crop',
    tagNames: ['立柱式'],
  },
  {
    city: '成都',
    styleDescription: '熊猫元素装饰的仿古木质站牌，融合巴蜀文化，线路信息竖排展示',
    era: '1990年代',
    inUse: false,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    tagNames: ['仿古风', '立柱式'],
  },
  {
    city: '广州',
    styleDescription: '不锈钢框架玻璃面板，电子墨水屏显示到站信息，夜间自发光',
    era: '2020年代',
    inUse: true,
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
    tagNames: ['电子屏', '立柱式'],
  },
  {
    city: '西安',
    styleDescription: '仿唐风飞檐顶盖站牌，朱红立柱，线路牌嵌入仿古灯笼造型灯箱',
    era: '1980年代',
    inUse: false,
    imageUrl: 'https://images.unsplash.com/photo-1477959856237-f9db59b91a9d?w=600&h=400&fit=crop',
    tagNames: ['仿古风'],
  },
];

const PRESET_TAGS = [
  { name: '立柱式', color: 'primary' },
  { name: '仿古风', color: 'warning' },
  { name: '电子屏', color: 'info' },
  { name: '挂墙式', color: 'success' },
  { name: '候车亭', color: 'help' },
];

const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
if (tagCount.count === 0) {
  const insertTag = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
  for (const tag of PRESET_TAGS) {
    insertTag.run(tag.name, tag.color);
  }
  console.log(`已插入 ${PRESET_TAGS.length} 条预设标签`);
} else {
  console.log(`数据库已有 ${tagCount.count} 条标签，跳过标签 seed`);
}

const count = db.prepare('SELECT COUNT(*) as count FROM signs').get() as { count: number };
const signTagCount = db.prepare('SELECT COUNT(*) as count FROM sign_tags').get() as { count: number };

if (count.count === 0) {
  const insertSign = db.prepare(`
    INSERT INTO signs (city, style_description, era, in_use, image_url)
    VALUES (@city, @styleDescription, @era, @inUse, @imageUrl)
  `);
  const insertSignTag = db.prepare('INSERT INTO sign_tags (sign_id, tag_id) VALUES (?, ?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');

  const insertMany = db.transaction((items: typeof SEED_DATA) => {
    for (const item of items) {
      const result = insertSign.run({ ...item, inUse: item.inUse ? 1 : 0 });
      const signId = result.lastInsertRowid as number;
      for (const tagName of item.tagNames) {
        const tag = getTagId.get(tagName) as { id: number } | undefined;
        if (tag) {
          insertSignTag.run(signId, tag.id);
        }
      }
    }
  });

  insertMany(SEED_DATA);
  console.log(`已插入 ${SEED_DATA.length} 条站牌 seed 数据（含标签关联）`);
} else if (signTagCount.count === 0) {
  console.log('检测到已有站牌但无标签关联，开始补充关联数据...');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertSignTag = db.prepare('INSERT INTO sign_tags (sign_id, tag_id) VALUES (?, ?)');
  const allSigns = db.prepare('SELECT id, city FROM signs').all() as { id: number; city: string }[];

  const cityTagMap: Record<string, string[]> = {};
  for (const item of SEED_DATA) {
    cityTagMap[item.city] = item.tagNames;
  }

  for (const sign of allSigns) {
    const tagNames = cityTagMap[sign.city];
    if (tagNames) {
      for (const tagName of tagNames) {
        const tag = getTagId.get(tagName) as { id: number } | undefined;
        if (tag) {
          insertSignTag.run(sign.id, tag.id);
        }
      }
    }
  }
  console.log('标签关联补充完成');
} else {
  console.log(`数据库已有 ${count.count} 条记录，跳过站牌 seed`);
}
