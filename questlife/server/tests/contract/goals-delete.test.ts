import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('DELETE /api/goals/:id', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  const goalId = 'goal-123';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete goal successfully', async () => {
    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Goal deleted successfully',
      data: {
        id: goalId,
        deletedAt: expect.any(String)
      }
    });
  });

  it('should cascade delete related data', async () => {
    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: goalId,
      relatedDeleted: {
        quests: expect.any(Number),
        milestones: expect.any(Number),
        characterClass: expect.any(Boolean)
      }
    });
  });

  it('should reject non-existent goal', async () => {
    const response = await request(app)
      .delete('/api/goals/non-existent')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Goal not found'
    });
  });

  it('should reject unauthorized deletion', async () => {
    const response = await request(app)
      .delete('/api/goals/other-user-goal')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Not authorized to delete this goal'
    });
  });

  it('should handle soft delete option', async () => {
    const response = await request(app)
      .delete(`/api/goals/${goalId}?soft=true`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Goal archived successfully',
      data: {
        id: goalId,
        archived: true,
        archivedAt: expect.any(String)
      }
    });
  });

  it('should prevent double deletion', async () => {
    // First delete
    await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`);

    // Second delete attempt
    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Goal not found or already deleted'
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .delete(`/api/goals/${goalId}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });

  it('should update user stats after deletion', async () => {
    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('updatedStats');
    expect(response.body.data.updatedStats).toMatchObject({
      totalGoals: expect.any(Number),
      activeGoals: expect.any(Number)
    });
  });
});