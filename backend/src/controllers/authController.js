const authService = require('../services/authService');
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    if (result === 'NOT_FOUND') return res.status(404).json({ message: 'User not found' });
    if (result === 'WRONG_PASSWORD') return res.status(401).json({ message: 'Wrong credentials' });
    return res.json({ user: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.signup = async (req, res) => {
  try {
    const payload = req.body;
    const created = await authService.signup(payload);
    return res.status(201).json({ user: created });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const updated = await authService.updatePassword(email, password);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
