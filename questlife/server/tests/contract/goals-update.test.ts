import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('PATCH /api/goals/:id', () => {
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

  it('should update goal title', async () => {
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Updated Goal Title'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Goal updated successfully',
      data: {
        id: goalId,
        title: 'Updated Goal Title',
        updatedAt: expect.any(String)
      }
    });
  });

  it('should update goal description', async () => {
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        description: 'New detailed description of the goal'
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: goalId,
      description: 'New detailed description of the goal'
    });
  });

  it('should update goal milestones', async () => {
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        milestones: [
          { id: 'm1', title: 'Milestone 1', completed: false },
          { id: 'm2', title: 'Milestone 2', completed: true }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.milestones).toHaveLength(2);
    expect(response.body.data.milestones[1].completed).toBe(true);
  });

  it('should update goal deadline', async () => {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        deadline
      });

    expect(response.status).toBe(200);
    expect(response.body.data.deadline).toBe(deadline);
  });

  it('should allow partial updates', async () => {
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Partially Updated',
        priority: 'high'
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      title: 'Partially Updated',
      priority: 'high'
    });
  });

  it('should reject non-existent goal', async () => {
    const response = await request(app)
      .patch('/api/goals/non-existent')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Updated Title'
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Goal not found'
    });
  });

  it('should reject unauthorized update', async () => {
    const response = await request(app)
      .patch('/api/goals/other-user-goal')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Trying to update others goal'
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Not authorized to update this goal'
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .patch(`/api/goals/${goalId}`)
      .send({
        title: 'Updated without auth'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });
});