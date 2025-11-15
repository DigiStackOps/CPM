const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/mysqlPool');

// These tests expect a running test DB; in CI we start a MySQL service and run init-admin-db.sql

afterAll(async () => {
  await pool.end();
});

test('signup -> login happy path', async () => {
  const email = `test${Date.now()}@example.com`;
  const signupRes = await request(app).post('/api/auth/signup').send({
    email, password: '123456', full_name: 'Test User'
  });
  expect(signupRes.status).toBe(201);

  const loginRes = await request(app).post('/api/auth/login').send({ email, password:'123456' });
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.user.email).toBe(email);
});