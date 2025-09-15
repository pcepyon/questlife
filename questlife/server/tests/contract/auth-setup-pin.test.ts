import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('POST /api/auth/setup-pin', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      message: 'PIN setup successful',
      data: {
        userId: 'test-user-123',
        sessionToken: expect.any(String)
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
      error: 'PIN must be 4-6 digits'
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
      error: 'PIN must contain only digits'
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
      error: 'PIN already set for this user'
    });
  });
});