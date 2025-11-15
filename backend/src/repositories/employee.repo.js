const pool = require('../db/mysqlPool');

const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM employee WHERE email = ? LIMIT 1', [email]);
  return rows[0];
};

const createEmployee = async (employee) => {
  const { full_name, email, password_hash, mobile, city, gender } = employee;
  const [res] = await pool.query(
    `INSERT INTO employee (full_name, email, password_hash, mobile, city, gender)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, email, password_hash, mobile, city, gender]
  );
  return res.insertId;
};

const updatePassword = async (email, newHash) => {
  await pool.query('UPDATE employee SET password_hash = ? WHERE email = ?', [newHash, email]);
};

module.exports = { findByEmail, createEmployee, updatePassword };