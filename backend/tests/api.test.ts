// Requires PostgreSQL running + migrated (see README). Run: npm test
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'http';
import { createApp } from '../src/app';

process.env.JWT_SECRET ??= 'test-secret';
let server: Server; let base = '';
const post = (p: string, body: unknown, token?: string) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });

beforeAll(async () => { server = createApp().listen(0); await new Promise((r) => server.once('listening', r)); base = `http://localhost:${(server.address() as { port: number }).port}`; });
afterAll(() => { server.close(); });

describe('api', () => {
  const email = `t${Date.now()}@test.dev`;
  let token = '';
  it('registers a patient', async () => { const r = await post('/api/auth/register', { name: 'T', email, password: 'password123' }); expect(r.status).toBe(201); token = (await r.json()).token; });
  it('rejects duplicate registration', async () => expect((await post('/api/auth/register', { name: 'T', email, password: 'password123' })).status).toBe(409));
  it('rejects bad login', async () => expect((await post('/api/auth/login', { email, password: 'wrongpass1' })).status).toBe(401));
  it('forbids patients from creating facilities', async () => expect((await post('/api/facilities', { name: 'x' }, token)).status).toBe(403));
  it('requires login for admin dashboard', async () => expect((await fetch(base + '/api/admin/dashboard')).status).toBe(401));
  it('classifies emergencies', async () => { const r = await (await post('/api/ai/classify-emergency', { text: 'a cobra bit my father' })).json(); expect(r.emergencyType).toBe('SNAKE_BITE'); });
  it('rejects invalid coordinates', async () => expect((await post('/api/emergency', { emergencyType: 'SNAKE_BITE', latitude: 200, longitude: 0 })).status).toBe(400));
  it('creates an emergency and finds nearby facilities (needs seed data)', async () => {
    const r = await post('/api/emergency', { emergencyType: 'SNAKE_BITE', latitude: 13.08, longitude: 80.27 }); expect(r.status).toBe(201);
    const n = await (await fetch(base + '/api/facilities/nearby?lat=13.08&lon=80.27&type=SNAKE_BITE')).json(); expect(Array.isArray(n.results)).toBe(true);
  });
});
