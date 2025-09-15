import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('PIN Authentication Flow Integration', () => {
  let app: express.Application;
  let userId: string;
  let sessionToken: string;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full authentication cycle', async () => {
    // Step 1: Create user
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Auth Test User',
        email: 'auth@example.com'
      });

    expect(createUserResponse.status).toBe(201);
    userId = createUserResponse.body.data.userId;

    // Step 2: Setup PIN
    const setupResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '1234'
      });

    expect(setupResponse.status).toBe(201);
    expect(setupResponse.body.data).toHaveProperty('sessionToken');

    // Step 3: Logout
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${setupResponse.body.data.sessionToken}`);

    expect(logoutResponse.status).toBe(200);

    // Step 4: Verify PIN to login again
    const loginResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '1234'
      });

    expect(loginResponse.status).toBe(200);
    sessionToken = loginResponse.body.data.sessionToken;

    // Step 5: Access protected resource
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(dashboardResponse.status).toBe(200);

    // Step 6: Change PIN
    const changePinResponse = await request(app)
      .put('/api/auth/change-pin')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        currentPin: '1234',
        newPin: '5678'
      });

    expect(changePinResponse.status).toBe(200);

    // Step 7: Verify old PIN fails
    const oldPinResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '1234'
      });

    expect(oldPinResponse.status).toBe(401);

    // Step 8: Verify new PIN works
    const newPinResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '5678'
      });

    expect(newPinResponse.status).toBe(200);
  });

  it('should handle session expiration', async () => {
    // Setup user and PIN
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Session Test',
        email: 'session@example.com'
      });

    userId = createUserResponse.body.data.userId;

    const setupResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '1111'
      });

    const expiredToken = 'expired-token';

    // Try to access with expired token
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(dashboardResponse.status).toBe(401);
    expect(dashboardResponse.body.error).toContain('expired');

    // Should be able to login again
    const loginResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '1111'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.sessionToken).toBeDefined();
  });

  it('should handle rate limiting on PIN attempts', async () => {
    // Setup user
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Rate Limit Test',
        email: 'ratelimit@example.com'
      });

    userId = createUserResponse.body.data.userId;

    await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '2222'
      });

    // Make multiple failed attempts
    const attempts = [];
    for (let i = 0; i < 5; i++) {
      attempts.push(
        request(app)
          .post('/api/auth/verify-pin')
          .send({
            userId,
            pin: '0000' // Wrong PIN
          })
      );
    }

    const responses = await Promise.all(attempts);
    
    // First few should be 401
    expect(responses[0].status).toBe(401);
    expect(responses[1].status).toBe(401);
    
    // Last one should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(423);
    expect(lastResponse.body.error).toContain('locked');

    // Even correct PIN should fail during lockout
    const correctPinResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '2222'
      });

    expect(correctPinResponse.status).toBe(423);
  });

  it('should maintain separate sessions for different users', async () => {
    // Create two users
    const user1Response = await request(app)
      .post('/api/users')
      .send({
        name: 'User One',
        email: 'user1@example.com'
      });

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        name: 'User Two',
        email: 'user2@example.com'
      });

    const user1Id = user1Response.body.data.userId;
    const user2Id = user2Response.body.data.userId;

    // Setup PINs for both
    const user1Setup = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: user1Id,
        pin: '1111'
      });

    const user2Setup = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: user2Id,
        pin: '2222'
      });

    const token1 = user1Setup.body.data.sessionToken;
    const token2 = user2Setup.body.data.sessionToken;

    // Each should access their own dashboard
    const dashboard1 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token1}`);

    const dashboard2 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token2}`);

    expect(dashboard1.status).toBe(200);
    expect(dashboard2.status).toBe(200);
    expect(dashboard1.body.data).not.toEqual(dashboard2.body.data);

    // User 1 token shouldn't access user 2 data
    const crossAccessResponse = await request(app)
      .get(`/api/users/${user2Id}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(crossAccessResponse.status).toBe(403);
  });
});