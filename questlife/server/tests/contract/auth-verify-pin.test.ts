import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('POST /api/auth/verify-pin', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify correct PIN and return session', async () => {
    const response = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId: 'test-user-123',
        pin: '1234'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Authentication successful',
      data: {
        userId: 'test-user-123',
        sessionToken: expect.any(String),
        expiresAt: expect.any(String)
      }
    });
  });

  it('should reject incorrect PIN', async () => {
    const response = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId: 'test-user-123',
        pin: '9999'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid PIN',
      attemptsRemaining: expect.any(Number)
    });
  });

  it('should lock account after max attempts', async () => {
    // Simulate multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/verify-pin')
        .send({
          userId: 'test-user-123',
          pin: '0000'
        });
    }

    const response = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId: 'test-user-123',
        pin: '1234' // Even correct PIN should fail
      });

    expect(response.status).toBe(423);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Account locked due to too many failed attempts',
      lockDuration: expect.any(Number)
    });
  });

  it('should reject missing userId', async () => {
    const response = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        pin: '1234'
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'userId is required'
    });
  });
});