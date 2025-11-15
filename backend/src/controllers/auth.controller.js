const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const login = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      if (!result.ok) {
        if (result.reason === 'NOT_FOUND') return res.status(404).json({ message: 'User not found' });
        if (result.reason === 'WRONG_PASSWORD') return res.status(401).json({ message: 'Wrong credentials' });
      }
      return res.json({ user: result.user });
    } catch (err) { next(err); }
  }
];

const signup = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty(),
  async (req, res, next) => {
    try {
      const result = await authService.signup(req.body);
      if (!result.ok) return res.status(409).json({ message: 'Email already registered' });
      return res.status(201).json({ id: result.id });
    } catch (err) { next(err); }
  }
];

const forgotPassword = [
  body('email').isEmail(),
  body('newPassword').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;
      const result = await authService.resetPassword(email, newPassword);
      if (!result.ok) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'Password updated' });
    } catch (err) { next(err); }
  }
];

module.exports = { login, signup, forgotPassword };