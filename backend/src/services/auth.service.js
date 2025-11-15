const bcrypt = require('bcrypt');
const repo = require('../repositories/employee.repo');
const SALT_ROUNDS = 12;

async function login(email, password) {
  const user = await repo.findByEmail(email);
  if (!user) return { ok: false, reason: 'NOT_FOUND' };
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return { ok: false, reason: 'WRONG_PASSWORD' };
  return { ok: true, user: { id: user.id, email: user.email, full_name: user.full_name } };
}

async function signup(payload) {
  const exists = await repo.findByEmail(payload.email);
  if (exists) return { ok: false, reason: 'ALREADY_EXISTS' };
  const hash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const id = await repo.createEmployee({
    full_name: payload.full_name,
    email: payload.email,
    password_hash: hash,
    mobile: payload.mobile || null,
    city: payload.city || null,
    gender: payload.gender || 'Male'
  });
  return { ok: true, id };
}

async function resetPassword(email, newPassword) {
  const user = await repo.findByEmail(email);
  if (!user) return { ok: false, reason: 'NOT_FOUND' };
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await repo.updatePassword(email, newHash);
  return { ok: true };
}

module.exports = { login, signup, resetPassword };