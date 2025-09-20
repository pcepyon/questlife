import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index.js';
describe('PUT /api/auth/change-pin', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);  });

  afterEach(() => {
    // Clean up after each test;
  });

  it('should change PIN with valid current PIN', async () => {
    const response = await request(app)
      .put('/api/auth/change-pin')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPin: '1234',
        newPin: '5678'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'PIN changed successfully'
    });
  });

  it('should reject change with incorrect current PIN', async () => {
    const response = await request(app)
      .put('/api/auth/change-pin')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPin: '0000',
        newPin: '5678'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Current PIN is incorrect'
    });
  });

  it('should reject invalid new PIN format', async () => {
    const response = await request(app)
      .put('/api/auth/change-pin')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPin: '1234',
        newPin: '12' // Too short
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'New PIN must be 4-6 digits'
    });
  });

  it('should reject same PIN as current', async () => {
    const response = await request(app)
      .put('/api/auth/change-pin')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPin: '1234',
        newPin: '1234' // Same as current
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'New PIN must be different from current PIN'
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .put('/api/auth/change-pin')
      .send({
        currentPin: '1234',
        newPin: '5678'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });
});