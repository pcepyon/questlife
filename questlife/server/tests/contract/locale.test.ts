import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/locale', () => {
  it('should return LocaleConfig schema for Korean', async () => {
    const response = await request(app)
      .get('/api/locale')
      .set('Accept-Language', 'ko')
      .expect(200);

    expect(response.body).toMatchObject({
      locale: 'ko',
      language: 'Korean',
      dateFormat: 'yyyy년 MM월 dd일',
      timeFormat: 'HH시 mm분',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '₩'
      },
      direction: 'ltr'
    });
  });

  it('should detect locale from query parameter', async () => {
    const response = await request(app)
      .get('/api/locale?locale=ko')
      .expect(200);

    expect(response.body.locale).toBe('ko');
  });

  it('should detect locale from X-Locale header', async () => {
    const response = await request(app)
      .get('/api/locale')
      .set('X-Locale', 'ko')
      .expect(200);

    expect(response.body.locale).toBe('ko');
  });

  it('should fallback to default locale', async () => {
    const response = await request(app)
      .get('/api/locale')
      .expect(200);

    expect(response.body.locale).toBe('ko');
  });
});