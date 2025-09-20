import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/quests with locale', () => {
  it('should return quests with Korean fields when locale=ko', async () => {
    const response = await request(app)
      .get('/api/quests?locale=ko')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      const quest = response.body[0];
      expect(quest).toHaveProperty('id');
      expect(quest).toHaveProperty('title');
      expect(quest).toHaveProperty('titleKo');
      expect(quest).toHaveProperty('description');
      expect(quest).toHaveProperty('descriptionKo');
      expect(quest).toHaveProperty('type');
      expect(quest).toHaveProperty('typeKo');
      expect(quest).toHaveProperty('xp');
    }
  });

  it('should detect locale from Accept-Language header', async () => {
    const response = await request(app)
      .get('/api/quests')
      .set('Accept-Language', 'ko-KR,ko;q=0.9')
      .expect(200);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('titleKo');
    }
  });

  it('should format quest types in Korean', async () => {
    const response = await request(app)
      .get('/api/quests?locale=ko')
      .expect(200);

    const questTypes = {
      'daily': '일일 퀘스트',
      'weekly': '주간 퀘스트',
      'special': '특별 퀘스트'
    };

    response.body.forEach((quest: any) => {
      if (quest.type in questTypes) {
        expect(quest.typeKo).toBe(questTypes[quest.type as keyof typeof questTypes]);
      }
    });
  });
});