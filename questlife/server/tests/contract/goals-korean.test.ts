import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/goals/analyze with Korean', () => {
  it('should accept Korean goal input', async () => {
    const koreanGoal = {
      text: '매일 1시간씩 프로그래밍 공부하기',
      locale: 'ko'
    };

    const response = await request(app)
      .post('/api/goals/analyze')
      .set('X-Locale', 'ko')
      .send(koreanGoal)
      .expect(200);

    expect(response.body).toHaveProperty('className');
    expect(response.body).toHaveProperty('classNameKo');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('descriptionKo');
    expect(response.body).toHaveProperty('quests');
  });

  it('should return localized quest structure', async () => {
    const koreanGoal = {
      text: '운동으로 건강한 몸 만들기',
      locale: 'ko'
    };

    const response = await request(app)
      .post('/api/goals/analyze')
      .set('X-Locale', 'ko')
      .send(koreanGoal)
      .expect(200);

    const quest = response.body.quests[0];
    expect(quest).toHaveProperty('title');
    expect(quest).toHaveProperty('titleKo');
    expect(quest).toHaveProperty('description');
    expect(quest).toHaveProperty('descriptionKo');
    expect(quest).toHaveProperty('xp');
  });

  it('should mix Korean and English for gaming terms', async () => {
    const koreanGoal = {
      text: '게임 개발자 되기',
      locale: 'ko'
    };

    const response = await request(app)
      .post('/api/goals/analyze')
      .set('X-Locale', 'ko')
      .send(koreanGoal)
      .expect(200);

    expect(response.body.level).toBe(1);
    expect(response.body.xp).toBe(0);
    expect(response.body.classNameKo).toBeTruthy();
    expect(response.body.className).toMatch(/[A-Za-z]/);
  });
});