import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index.js';

describe('POST /api/auth/setup-pin', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  afterEach(() => {
    // Clean up after each test
  });

  it('should setup PIN for new user', async () => {
    const response = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: 'test-user-123',
        pin: '1234'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining('PIN'),
        user: expect.objectContaining({
          id: expect.any(String)
        })
      }
    });
  });

  it('should reject invalid PIN length', async () => {
    const response = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: 'test-user-123',
        pin: '123' // Too short
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: expect.stringContaining('Invalid')
    });
  });

  it('should reject non-numeric PIN', async () => {
    const response = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: 'test-user-123',
        pin: 'abcd'
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: expect.stringContaining('Invalid')
    });
  });

  it('should reject duplicate PIN setup', async () => {
    const response = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: 'existing-user',
        pin: '5678'
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      error: expect.stringContaining('PIN')
    });
  });
});