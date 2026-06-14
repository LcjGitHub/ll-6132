import { testRequest } from './test-helper';
import type { BusSign, PaginatedResponse } from '../src/types';

describe('GET /api/signs - 站牌列表接口', () => {

  describe('无筛选条件', () => {
    it('应返回全部站牌数据', async () => {
      const res = await testRequest().get('/api/signs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
      const cities = res.body.map((item: BusSign) => item.city);
      expect(cities).toEqual(expect.arrayContaining(['北京', '上海', '成都', '广州', '西安']));
      const provinces = res.body.map((item: BusSign) => item.province);
      expect(provinces).toEqual(expect.arrayContaining(['北京市', '上海市', '四川省', '广东省', '陕西省']));
    });

    it('每条站牌应包含完整字段', async () => {
      const res = await testRequest().get('/api/signs');
      const sign = res.body[0];
      expect(sign).toHaveProperty('id');
      expect(sign).toHaveProperty('province');
      expect(sign).toHaveProperty('city');
      expect(sign).toHaveProperty('styleDescription');
      expect(sign).toHaveProperty('era');
      expect(sign).toHaveProperty('inUse');
      expect(sign).toHaveProperty('imageUrl');
      expect(sign).toHaveProperty('tags');
      expect(Array.isArray(sign.tags)).toBe(true);
    });
  });

  describe('按省份筛选', () => {
    it('筛选四川省的站牌', async () => {
      const res = await testRequest().get('/api/signs').query({ province: '四川省' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].province).toBe('四川省');
      expect(res.body[0].city).toBe('成都');
    });

    it('筛选不存在的省份应返回空数组', async () => {
      const res = await testRequest().get('/api/signs').query({ province: '不存在的省份' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('空字符串省份参数应忽略筛选', async () => {
      const res = await testRequest().get('/api/signs').query({ province: '' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(5);
    });

    it('省份 + 城市组合筛选', async () => {
      const res = await testRequest().get('/api/signs').query({ province: '广东省', city: '广州' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].province).toBe('广东省');
      expect(res.body[0].city).toBe('广州');
    });
  });

  describe('按城市筛选', () => {
    it('筛选北京的站牌', async () => {
      const res = await testRequest().get('/api/signs').query({ city: '北京' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].city).toBe('北京');
    });

    it('筛选不存在的城市应返回空数组', async () => {
      const res = await testRequest().get('/api/signs').query({ city: '不存在的城市' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('空字符串城市参数应忽略筛选', async () => {
      const res = await testRequest().get('/api/signs').query({ city: '' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(5);
    });
  });

  describe('关键词模糊搜索', () => {
    it('按风格描述关键词搜索', async () => {
      const res = await testRequest().get('/api/signs').query({ keyword: '电子' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const item of res.body) {
        expect(item.styleDescription).toContain('电子');
      }
    });

    it('搜索"仿古"关键词应匹配成都和西安', async () => {
      const res = await testRequest().get('/api/signs').query({ keyword: '仿古' });
      expect(res.status).toBe(200);
      const cities = res.body.map((item: BusSign) => item.city);
      expect(cities).toEqual(expect.arrayContaining(['成都', '西安']));
      expect(cities.length).toBe(2);
    });

    it('空关键词应返回全部', async () => {
      const res = await testRequest().get('/api/signs').query({ keyword: '' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(5);
    });

    it('不存在的关键词应返回空数组', async () => {
      const res = await testRequest().get('/api/signs').query({ keyword: '不存在的关键词xyz' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('分页功能', () => {
    it('正常分页查询', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 1, pageSize: 2 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.items).toBeDefined();
      expect(data.total).toBe(5);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(2);
      expect(data.items.length).toBe(2);
    });

    it('第二页数据', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 2, pageSize: 2 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.items.length).toBe(2);
      expect(data.page).toBe(2);
    });

    it('最后一页可能不满一页数据', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 3, pageSize: 2 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.items.length).toBe(1);
      expect(data.page).toBe(3);
    });
  });

  describe('分页参数边界', () => {
    it('页码为负数应自动修正为第1页', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: -1, pageSize: 2 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.page).toBe(1);
      expect(data.items.length).toBe(2);
    });

    it('页码为0应自动修正为第1页', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 0, pageSize: 2 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.page).toBe(1);
    });

    it('每页条数超过上限100应自动修正为100', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 1, pageSize: 200 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.pageSize).toBe(100);
      expect(data.items.length).toBe(5);
    });

    it('每页条数为负数应自动修正为最小1', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 1, pageSize: -5 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.pageSize).toBe(1);
      expect(data.items.length).toBe(1);
    });

    it('每页条数为0应自动修正为最小1', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 1, pageSize: 0 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.pageSize).toBeGreaterThanOrEqual(1);
    });

    it('pageSize 刚好等于100为上限边界值', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ page: 1, pageSize: 100 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.pageSize).toBe(100);
    });
  });

  describe('筛选 + 分页组合', () => {
    it('城市筛选 + 分页', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ city: '北京', page: 1, pageSize: 10 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.total).toBe(1);
      expect(data.items.length).toBe(1);
      expect(data.items[0].city).toBe('北京');
    });

    it('关键词搜索 + 分页', async () => {
      const res = await testRequest()
        .get('/api/signs')
        .query({ keyword: '电子', page: 1, pageSize: 10 });
      expect(res.status).toBe(200);
      const data = res.body as PaginatedResponse<BusSign>;
      expect(data.total).toBeGreaterThan(0);
      for (const item of data.items) {
        expect(item.styleDescription).toContain('电子');
      }
    });
  });
});
