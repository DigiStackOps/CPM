const pool = require('../db/mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
exports.login = async (email, password) => {
  const [rows] = await pool.query('SELECT id, name, email, password_hash FROM employee WHERE email = ?', [email]);
  if (!rows || rows.length === 0) return 'NOT_FOUND';
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return 'WRONG_PASSWORD';
  delete user.password_hash;
  return user;
};
exports.signup = async (payload) => {
  const { name, mobile, gender, marriage_status, email, password } = payload;
  const password_hash = await bcrypt.hash(password, saltRounds);
  const [result] = await pool.query(
    `INSERT INTO employee (name,mobile,gender,marriage_status,email,password_hash)
     VALUES (?,?,?,?,?,?)`,
    [name, mobile, gender, marriage_status, email, password_hash]
  );
  return { id: result.insertId, name, email };
};
exports.updatePassword = async (email, newPassword) => {
  const password_hash = await bcrypt.hash(newPassword, saltRounds);
  const [result] = await pool.query('UPDATE employee SET password_hash = ? WHERE email = ?', [password_hash, email]);
  return result.affectedRows > 0;
};
