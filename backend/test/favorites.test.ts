import { testRequest, db } from './test-helper';
import type { FavoriteWithSign } from '../src/types';

describe('收藏接口', () => {

  describe('POST /api/favorites - 添加收藏', () => {
    it('成功添加收藏', async () => {
      const res = await testRequest()
        .post('/api/favorites')
        .send({ signId: 1 });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.signId).toBe(1);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('sign');
      expect(res.body.sign.id).toBe(1);
    });

    it('重复添加同一站牌应返回409冲突', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      const res = await testRequest()
        .post('/api/favorites')
        .send({ signId: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('该站牌已收藏');
    });

    it('添加不存在的站牌应返回404', async () => {
      const res = await testRequest()
        .post('/api/favorites')
        .send({ signId: 9999 });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('站牌不存在');
    });

    it('缺少signId参数应返回400', async () => {
      const res = await testRequest()
        .post('/api/favorites')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('缺少或无效的 signId');
    });

    it('signId类型错误应返回400', async () => {
      const res = await testRequest()
        .post('/api/favorites')
        .send({ signId: 'abc' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/favorites/:signId - 取消收藏', () => {
    it('成功取消收藏', async () => {
      await testRequest().post('/api/favorites').send({ signId: 2 });
      const res = await testRequest().delete('/api/favorites/2');
      expect(res.status).toBe(204);
    });

    it('取消不存在的收藏应返回404', async () => {
      const res = await testRequest().delete('/api/favorites/9999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('收藏记录不存在');
    });

    it('signId无效应返回400', async () => {
      const res = await testRequest().delete('/api/favorites/abc');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('无效的 signId');
    });

    it('取消后可重新添加收藏', async () => {
      await testRequest().post('/api/favorites').send({ signId: 3 });
      await testRequest().delete('/api/favorites/3');
      const res = await testRequest().post('/api/favorites').send({ signId: 3 });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/favorites - 收藏列表', () => {
    it('初始收藏列表为空', async () => {
      const res = await testRequest().get('/api/favorites');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('添加收藏后列表显示对应的记录', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      await testRequest().post('/api/favorites').send({ signId: 2 });
      const res = await testRequest().get('/api/favorites');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const signIds = res.body.map((f: FavoriteWithSign) => f.signId);
      expect(signIds).toEqual(expect.arrayContaining([1, 2]));
    });

    it('收藏记录包含站牌详情', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      const res = await testRequest().get('/api/favorites');
      const fav = res.body[0];
      expect(fav.sign).toBeDefined();
      expect(fav.sign.city).toBeDefined();
      expect(fav.sign.styleDescription).toBeDefined();
    });

    it('收藏列表按创建时间倒序排列', async () => {
      db.prepare('INSERT INTO favorites (sign_id, created_at) VALUES (?, ?)').run(1, '2024-01-01 10:00:00');
      db.prepare('INSERT INTO favorites (sign_id, created_at) VALUES (?, ?)').run(2, '2024-01-02 10:00:00');
      const res = await testRequest().get('/api/favorites');
      expect(res.body.length).toBe(2);
      expect(res.body[0].signId).toBe(2);
      expect(res.body[1].signId).toBe(1);
    });
  });

  describe('GET /api/favorites/check/:signId - 检查收藏状态', () => {
    it('未收藏时返回favorited: false', async () => {
      const res = await testRequest().get('/api/favorites/check/1');
      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(false);
    });

    it('已收藏时返回favorited: true及创建时间', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      const res = await testRequest().get('/api/favorites/check/1');
      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(true);
      expect(res.body.createdAt).toBeDefined();
    });

    it('无效的signId返回400', async () => {
      const res = await testRequest().get('/api/favorites/check/abc');
      expect(res.status).toBe(400);
    });
  });

  describe('级联删除 - 删除站牌后收藏记录级联清除', () => {
    it('删除站牌后对应的收藏记录应被级联清除', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      const favBefore = await testRequest().get('/api/favorites');
      expect(favBefore.body.length).toBe(1);

      const deleteRes = await testRequest().delete('/api/signs/1');
      expect(deleteRes.status).toBe(204);

      const favAfter = await testRequest().get('/api/favorites');
      expect(favAfter.body.length).toBe(0);
    });

    it('删除站牌后检查该站牌收藏状态应返回未收藏', async () => {
      await testRequest().post('/api/favorites').send({ signId: 2 });
      await testRequest().delete('/api/signs/2');

      const row = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE sign_id = ?').get(2) as { count: number };
      expect(row.count).toBe(0);
    });

    it('其他站牌的收藏不受影响', async () => {
      await testRequest().post('/api/favorites').send({ signId: 1 });
      await testRequest().post('/api/favorites').send({ signId: 2 });
      await testRequest().delete('/api/signs/1');

      const res = await testRequest().get('/api/favorites');
      expect(res.body.length).toBe(1);
      expect(res.body[0].signId).toBe(2);
    });
  });
});
