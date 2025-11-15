const authService = require('../../src/services/auth.service');
const repo = require('../../src/repositories/employee.repo');
const bcrypt = require('bcrypt');

jest.mock('../../src/repositories/employee.repo');

describe('auth service', () => {
  test('login returns NOT_FOUND when user missing', async () => {
    repo.findByEmail.mockResolvedValue(null);
    const res = await authService.login('no@x.com','abcd');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('NOT_FOUND');
  });

  test('login returns WRONG_PASSWORD when mismatch', async () => {
    const fakeUser = { id:1, email:'a@a.com', password_hash: await bcrypt.hash('secret',12) };
    repo.findByEmail.mockResolvedValue(fakeUser);
    const res = await authService.login('a@a.com','wrongpass');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('WRONG_PASSWORD');
  });
});