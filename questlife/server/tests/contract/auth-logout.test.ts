import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index.js';
describe('POST /api/auth/logout', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);  });

  afterEach(() => {
    // Clean up after each test;
  });

  it('should logout user with valid session', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Logged out successfully'
    });
  });

  it('should reject logout without authorization', async () => {
    const response = await request(app)
      .post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });

  it('should reject logout with invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid or expired token'
    });
  });

  it('should handle already logged out session', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);

    // First logout should succeed
    expect(response.status).toBe(200);

    // Second logout with same token should fail
    const secondResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);

    expect(secondResponse.status).toBe(401);
    expect(secondResponse.body).toMatchObject({
      success: false,
      error: 'Session already terminated'
    });
  });
});