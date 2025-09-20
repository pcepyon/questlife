import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/translations/:namespace', () => {
  const namespaces = ['common', 'quests', 'classes', 'errors', 'gaming'];

  namespaces.forEach(namespace => {
    it(`should return ${namespace} namespace translations`, async () => {
      const response = await request(app)
        .get(`/api/translations/${namespace}`)
        .set('Accept-Language', 'ko')
        .expect(200);

      expect(response.body).toHaveProperty('namespace', namespace);
      expect(response.body).toHaveProperty('locale', 'ko');
      expect(response.body).toHaveProperty('translations');
      expect(typeof response.body.translations).toBe('object');
    });
  });

  it('should return 404 for invalid namespace', async () => {
    await request(app)
      .get('/api/translations/invalid')
      .expect(404);
  });

  it('should support locale query parameter', async () => {
    const response = await request(app)
      .get('/api/translations/common?locale=ko')
      .expect(200);

    expect(response.body.locale).toBe('ko');
  });

  it('should validate translation key format', async () => {
    const response = await request(app)
      .get('/api/translations/common?locale=ko')
      .expect(200);

    const translations = response.body.translations;
    Object.keys(translations).forEach(key => {
      expect(key).toMatch(/^[a-zA-Z][a-zA-Z0-9_.]*$/);
    });
  });
});