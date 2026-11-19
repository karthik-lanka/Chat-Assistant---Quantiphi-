import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import Conversation from '../src/models/Conversation.js';

describe('API Endpoints Integration Suite', () => {
  let createdConversationId;

  before(async () => {
    try {
      await connectDatabase();
    } catch (err) {
      console.warn('MongoDB connection deferred during test setup:', err.message);
    }
  });

  after(async () => {
    try {
      if (createdConversationId && mongoose.connection.readyState === 1) {
        await Conversation.findByIdAndDelete(createdConversationId);
      }
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (err) {
      console.warn('Error during test teardown:', err.message);
    }
  });

  it('GET /api/health should return 200 with status ok and mongoStatus', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(typeof res.body.timestamp === 'string');
    assert.ok(typeof res.body.mongoStatus === 'string');
    assert.ok(typeof res.body.uptime === 'number');
  });

  it('GET /api/unknown-endpoint should return 404 Route not found', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Route not found');
  });

  it('GET /api/conversations/:id with invalid MongoId should return 400 validation error', async () => {
    const res = await request(app).get('/api/conversations/invalid-id-123');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
  });

  it('PATCH /api/conversations/:id with invalid MongoId should return 400 validation error', async () => {
    const res = await request(app).patch('/api/conversations/invalid-id-123').send({ title: 'New Title' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
  });

  it('POST /api/conversations/:id/chat with missing content should return 400', async () => {
    const fakeValidId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).post(`/api/conversations/${fakeValidId}/chat`).send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
  });

  it('POST /api/conversations/:id/chat with invalid tone should return 400', async () => {
    const fakeValidId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/conversations/${fakeValidId}/chat`)
      .send({ content: 'Hello', tone: 'sarcastic_tone' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
  });

  it('GET /api/conversations/:id with non-existent ID should return 404', async () => {
    const fakeValidId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/conversations/${fakeValidId}`);
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Conversation not found');
  });

  it('POST /api/conversations should create a new conversation and persist it', async () => {
    const res = await request(app).post('/api/conversations').send({ title: 'Test Automated Conversation' });
    assert.equal(res.status, 201);
    assert.ok(res.body._id);
    assert.equal(res.body.title, 'Test Automated Conversation');
    assert.ok(Array.isArray(res.body.messages));
    createdConversationId = res.body._id;
  });

  it('GET /api/conversations should list conversations including the newly created one', async () => {
    const res = await request(app).get('/api/conversations');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const found = res.body.find((c) => c._id === createdConversationId);
    assert.ok(found);
    assert.equal(found.title, 'Test Automated Conversation');
  });

  it('GET /api/conversations/:id should retrieve the conversation by ID', async () => {
    const res = await request(app).get(`/api/conversations/${createdConversationId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body._id, createdConversationId);
    assert.equal(res.body.title, 'Test Automated Conversation');
  });

  it('PATCH /api/conversations/:id should rename the conversation title', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${createdConversationId}`)
      .send({ title: 'Renamed Automated Conversation' });
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Renamed Automated Conversation');
  });

  it('DELETE /api/conversations/:id should delete the conversation', async () => {
    const res = await request(app).delete(`/api/conversations/${createdConversationId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, createdConversationId);

    // Verify it is gone
    const verifyRes = await request(app).get(`/api/conversations/${createdConversationId}`);
    assert.equal(verifyRes.status, 404);
    createdConversationId = null;
  });
});
