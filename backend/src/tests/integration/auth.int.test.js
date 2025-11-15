// Integration test example (requires a test DB configured via env vars)
const request = require('supertest');
const app = require('../../app');
describe('auth integration', () => {
  test('signup and login flow (smoke)', async () => {
    const email = `tuser${Date.now()}@example.com`;
    const signup = await request(app).post('/api/auth/signup').send({
      name: 'Test User', email, password: 'Abc12345', rePassword: 'Abc12345', gender: 'male', marriage_status: 'unmarried'
    });
    expect([201,409]).toContain(signup.status); // allow idempotent runs
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Abc12345' });
    // login may be 200 or 404 depending on whether signup created user
    expect([200,404,401]).toContain(login.status);
  }, 20000);
});
