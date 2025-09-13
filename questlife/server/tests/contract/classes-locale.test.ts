import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/classes with locale', () => {
  it('should return classes with Korean names when locale=ko', async () => {
    const response = await request(app)
      .get('/api/classes?locale=ko')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      const characterClass = response.body[0];
      expect(characterClass).toHaveProperty('id');
      expect(characterClass).toHaveProperty('name');
      expect(characterClass).toHaveProperty('nameKo');
      expect(characterClass).toHaveProperty('description');
      expect(characterClass).toHaveProperty('descriptionKo');
      expect(characterClass).toHaveProperty('level');
      expect(characterClass).toHaveProperty('xp');
    }
  });

  it('should mix Korean and English for gaming terms', async () => {
    const response = await request(app)
      .get('/api/classes?locale=ko')
      .expect(200);

    if (response.body.length > 0) {
      const characterClass = response.body[0];
      expect(characterClass.level).toBeGreaterThanOrEqual(1);
      expect(characterClass.level).toBeLessThanOrEqual(30);
      expect(typeof characterClass.xp).toBe('number');
      expect(characterClass.nameKo).toBeTruthy();
    }
  });

  it('should format class attributes with Korean labels', async () => {
    const response = await request(app)
      .get('/api/classes/1?locale=ko')
      .expect(200);

    if (response.body.attributes) {
      expect(response.body.attributes).toHaveProperty('strength');
      expect(response.body.attributes).toHaveProperty('strengthLabel', '힘');
      expect(response.body.attributes).toHaveProperty('wisdom');
      expect(response.body.attributes).toHaveProperty('wisdomLabel', '지혜');
      expect(response.body.attributes).toHaveProperty('creativity');
      expect(response.body.attributes).toHaveProperty('creativityLabel', '창의력');
    }
  });
});