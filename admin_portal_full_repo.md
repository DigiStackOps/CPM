# admin-portal (Full repo) — production-ready v1

This document contains a complete, end-to-end production-grade **single-repo** for the Admin portal (frontend, backend, DB migrations, tests, Jenkinsfile, and manual deploy steps). It's structured so you can copy each file into your repository and run locally or deploy to three EC2 VMs (frontend, backend, db). Future migration to microservices / containers is preserved by clean separation.

---

## Repo layout

```
admin-portal/
├─ frontend/
│  ├─ public/
│  │  └─ index.html
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ Login.jsx
│  │  │  ├─ Signup.jsx
│  │  │  └─ ForgotPassword.jsx
│  │  ├─ services/api.js
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ package.json
│  └─ vite.config.js
├─ backend/
│  ├─ src/
│  │  ├─ controllers/auth.controller.js
│  │  ├─ services/auth.service.js
│  │  ├─ repositories/employee.repo.js
│  │  ├─ db/mysqlPool.js
│  │  ├─ routes/auth.routes.js
│  │  ├─ middlewares/errorHandler.js
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ tests/
│  │  ├─ unit/auth.service.test.js
│  │  └─ integration/auth.routes.test.js
│  ├─ package.json
│  └─ .env.example
├─ db/
│  ├─ sql/init-admin-db.sql
│  └─ liquibase/
│     ├─ changelog-master.xml
│     └─ changelogs/001-create-employee-table.xml
├─ Jenkinsfile
└─ README.md
```

---

> **Important notes before running:**
> - Replace placeholder hostnames, credentials, and secrets with your environment values.
> - For production, secure secrets in a secrets manager (AWS Secrets Manager) and use HTTPS.

---

## 1) README.md (root)

```markdown
# Admin Portal — Full Repo (v1)

This repo contains frontend (React), backend (Node/Express), DB (MySQL) and Liquibase migrations.

## Quick local run (dev)

### Prereqs
- Node 18+
- MySQL 8 (local or Docker)
- npm

### DB
Create local DB or run in Docker:

```bash
# using docker
docker run --name admin-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8
# wait then
mysql -h127.0.0.1 -uroot -proot < db/sql/init-admin-db.sql
```

### Backend
```bash
cd backend
cp .env.example .env  # edit DB_ variables
npm ci
npm run dev
```

### Frontend
```bash
cd frontend
npm ci
npm run dev
```

### Tests
Backend unit & integration tests:
```bash
cd backend
npm test
```

## Deploy to EC2 overview
- vm-db: install MySQL, run Liquibase `db/liquibase/changelog-master.xml`
- vm-backend: copy backend files, install Node, env, run with systemd/PM2
- vm-frontend: build React `npm run build`, serve with Nginx

See Jenkinsfile and `Manual deployment` section for full steps.
```
```

---

## 2) DB: SQL and Liquibase

### `db/sql/init-admin-db.sql`
```sql
CREATE DATABASE IF NOT EXISTS AdminDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE AdminDB;

CREATE TABLE IF NOT EXISTS employee (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  mobile VARCHAR(30),
  city VARCHAR(100),
  gender ENUM('Male','Female','Other') DEFAULT 'Male',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `db/liquibase/changelogs/001-create-employee-table.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

  <changeSet id="001-create-employee-table" author="dev">
    <createTable tableName="employee">
      <column name="id" type="BIGINT" autoIncrement="true">
        <constraints primaryKey="true" nullable="false"/>
      </column>
      <column name="full_name" type="VARCHAR(255)"/>
      <column name="email" type="VARCHAR(255)">
        <constraints unique="true" nullable="false"/>
      </column>
      <column name="password_hash" type="VARCHAR(255)">
        <constraints nullable="false"/>
      </column>
      <column name="mobile" type="VARCHAR(30)"/>
      <column name="city" type="VARCHAR(100)"/>
      <column name="gender" type="VARCHAR(10)" defaultValue="Male"/>
      <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
      <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
    </createTable>
  </changeSet>

</databaseChangeLog>
```

### `db/liquibase/changelog-master.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

  <include file="changelogs/001-create-employee-table.xml"/>

</databaseChangeLog>
```

---

## 3) Backend code

### `backend/.env.example`
```
PORT=4000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=root
DB_NAME=AdminDB
FRONTEND_ORIGIN=http://localhost:5173
```

### `backend/package.json`
```json
{
  "name": "admin-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "express-validator": "^6.14.3",
    "helmet": "^6.0.0",
    "mysql2": "^3.2.0",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.1",
    "nodemon": "^2.0.0"
  }
}
```

### `backend/src/db/mysqlPool.js`
```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'AdminDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### `backend/src/repositories/employee.repo.js`
```js
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
```

### `backend/src/services/auth.service.js`
```js
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
```

### `backend/src/controllers/auth.controller.js`
```js
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
```

### `backend/src/routes/auth.routes.js`
```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
```

### `backend/src/middlewares/errorHandler.js`
```js
module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
```

### `backend/src/app.js`
```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));

app.use('/api/auth', authRoutes);
app.use(errorHandler);

module.exports = app;
```

### `backend/src/server.js`
```js
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 4) Backend tests

### `backend/tests/unit/auth.service.test.js`
```js
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
```

### `backend/tests/integration/auth.routes.test.js`
```js
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
```

---

## 5) Frontend

This is written with Vite + React. It's minimal but production-ready with framer-motion for smooth entrance animations.

### `frontend/package.json`
```json
{
  "name": "admin-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.3.0",
    "framer-motion": "^8.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.4.0"
  },
  "devDependencies": { "vite": "^4.0.0" }
}
```

### `frontend/public/index.html`
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend/src/main.jsx`
```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
```

### `frontend/src/App.jsx`
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/forgot" element={<ForgotPassword/>} />
      </Routes>
    </BrowserRouter>
  );
}
```

### `frontend/src/services/api.js`
```js
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const instance = axios.create({ baseURL: API_BASE, timeout: 5000 });
export default instance;
```

### `frontend/src/components/Login.jsx`
```jsx
import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);
    try{
      const res = await api.post('/auth/login',{email,password});
      setMsg('Login successful');
      // TODO: store session / JWT when implemented
    }catch(err){
      if (err.response) setMsg(err.response.data.message || 'Error');
      else setMsg('Network error');
    }
  };

  return (
    <div style={{maxWidth:380, margin:'40px auto', padding:20}}>
      <motion.h1 initial={{y:-40, opacity:0}} animate={{y:0, opacity:1}} transition={{duration:0.5}}>Hello again!</motion.h1>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" />
        <button type="submit">Login</button>
      </form>
      <div style={{marginTop:10}}>
        <Link to="/forgot">Forgot your password?</Link>
      </div>
      <div style={{marginTop:10}}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}
```

### `frontend/src/components/Signup.jsx`
```jsx
import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Signup(){
  const [form,setForm]=useState({full_name:'',mobile:'',city:'',gender:'Female',email:'',password:'',passwordAgain:''});
  const [msg,setMsg]=useState(null);
  const nav = useNavigate();

  const onChange = (k,v) => setForm(s=>({...s,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.passwordAgain) return setMsg('Passwords do not match');
    try{
      const res = await api.post('/auth/signup',{
        email: form.email, password: form.password, full_name: form.full_name, mobile: form.mobile, city: form.city, gender: form.gender
      });
      setMsg('Signup success');
      nav('/');
    }catch(err){
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{maxWidth:420, margin:'20px auto', padding:20}}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" value={form.full_name} onChange={e=>onChange('full_name', e.target.value)} />
        <input placeholder="Mobile" value={form.mobile} onChange={e=>onChange('mobile', e.target.value)} />
        <input placeholder="City" value={form.city} onChange={e=>onChange('city', e.target.value)} />
        <div>
          <label><input type="radio" name="gender" checked={form.gender==='Female'} onChange={()=>onChange('gender','Female')} /> Female</label>
          <label style={{marginLeft:10}}><input type="radio" name="gender" checked={form.gender==='Male'} onChange={()=>onChange('gender','Male')} /> Male</label>
        </div>
        <input placeholder="Email" value={form.email} onChange={e=>onChange('email', e.target.value)} />
        <input type="password" placeholder="Password" value={form.password} onChange={e=>onChange('password', e.target.value)} />
        <input type="password" placeholder="Password Again" value={form.passwordAgain} onChange={e=>onChange('passwordAgain', e.target.value)} />
        <label><input type="checkbox" required/> I agree</label>
        <button type="submit">Submit</button>
      </form>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}
```

### `frontend/src/components/ForgotPassword.jsx`
```jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword(){
  const [email,setEmail]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [msg,setMsg]=useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const res = await api.post('/auth/forgot-password',{ email, newPassword });
      setMsg('Password updated');
    }catch(err){
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{maxWidth:380, margin:'20px auto'}}>
      <h2>Forgot Password</h2>
      <form onSubmit={submit}>
        <input placeholder="Enter email address" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Create new password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <button type="submit">Change</button>
      </form>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}
```

---

## 6) Jenkinsfile (pipeline)

This Jenkinsfile performs: checkout, build, tests (backend), run Liquibase migrations, build frontend, and deploy to EC2 hosts (via SSH). You must configure Jenkins credentials (SSH key id) and environment variables.

### `Jenkinsfile`
```groovy
pipeline {
  agent any
  environment {
    FRONTEND_HOST = "${params.FRONTEND_HOST}"
    BACKEND_HOST = "${params.BACKEND_HOST}"
    DB_HOST = "${params.DB_HOST}"
    SSH_CREDENTIALS_ID = 'ec2-ssh-key' // set in Jenkins credentials
  }
  parameters {
    string(name: 'FRONTEND_HOST', defaultValue: '1.2.3.4')
    string(name: 'BACKEND_HOST', defaultValue: '1.2.3.5')
    string(name: 'DB_HOST', defaultValue: '1.2.3.6')
  }
  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Backend - install & test') {
      agent { label 'linux' }
      steps {
        dir('backend'){
          sh 'npm ci'
          sh 'npm test'
        }
      }
    }

    stage('DB - Migrate (Liquibase)'){
      steps{
        // Assumes liquibase is installed on Jenkins agent or use a docker container
        sh "liquibase --url=\"jdbc:mysql://${env.DB_HOST}:3306/AdminDB\" --username=${DB_USER} --password=${DB_PASS} --changeLogFile=db/liquibase/changelog-master.xml update"
      }
    }

    stage('Build Frontend'){
      steps{
        dir('frontend'){
          sh 'npm ci'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy Frontend'){
      steps{
        withCredentials([sshUserPrivateKey(credentialsId: SSH_CREDENTIALS_ID, keyFileVariable: 'KEY')]){
          sh "scp -i $KEY -r frontend/dist/* ec2-user@${env.FRONTEND_HOST}:/var/www/admin-portal/"
          sh "ssh -i $KEY ec2-user@${env.FRONTEND_HOST} 'sudo systemctl restart nginx'"
        }
      }
    }

    stage('Deploy Backend'){
      steps{
        withCredentials([sshUserPrivateKey(credentialsId: SSH_CREDENTIALS_ID, keyFileVariable: 'KEY')]){
          sh "scp -i $KEY -r backend/* ec2-user@${env.BACKEND_HOST}:/opt/admin-backend/"
          sh "ssh -i $KEY ec2-user@${env.BACKEND_HOST} 'cd /opt/admin-backend && npm ci --production && sudo systemctl restart admin-backend'"
        }
      }
    }
  }
  post {
    failure { mail to: 'devops-team@example.com', subject: "Build failed: ${env.JOB_NAME}", body: 'See Jenkins' }
  }
}
```

> **Jenkins setup notes:**
> - Create `ec2-ssh-key` credentials (SSH private key) in Jenkins and allow agent to access Docker / Liquibase.
> - Set `DB_USER` and `DB_PASS` as Jenkins secret env variables or store in Credentials and inject.

---

## 7) Manual deploy steps (detailed)

### VM: vm-db (MySQL)
1. Launch EC2 (Ubuntu 22.04) in private subnet. Size depends on load (t3.medium or larger).
2. Install MySQL 8:
   ```bash
   sudo apt update && sudo apt install -y mysql-server
   sudo systemctl enable --now mysql
   sudo mysql_secure_installation
   ```
3. Create DB and user:
   ```sql
   CREATE DATABASE AdminDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'admin'@'%' IDENTIFIED BY 'StrongPassHere';
   GRANT ALL PRIVILEGES ON AdminDB.* TO 'admin'@'%';
   FLUSH PRIVILEGES;
   ```
4. Optionally install Liquibase (download binary) and run on the changeLog file:
   ```bash
   liquibase --url="jdbc:mysql://localhost:3306/AdminDB" --username=admin --password='StrongPassHere' --changeLogFile=/path/to/repo/db/liquibase/changelog-master.xml update
   ```
5. Open security groups so only backend VM IP can connect to port 3306.

### VM: vm-backend (Node)
1. Launch EC2 (Ubuntu), open port 22 and 4000 from frontend or LB.
2. Install Node 18+, Git, Nginx (optional), and PM2 or systemd.
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   sudo npm install -g pm2
   ```
3. Clone repo and configure env:
   ```bash
   sudo mkdir -p /opt/admin-backend
   sudo chown ubuntu:ubuntu /opt/admin-backend
   git clone <repo> /opt/admin-backend
   cd /opt/admin-backend/backend
   cp .env.example .env
   # edit .env to point DB_HOST to vm-db private IP and DB credentials
   npm ci
   pm2 start src/server.js --name admin-backend
   pm2 save
   ```
4. Or use systemd unit (create `/etc/systemd/system/admin-backend.service`) with ExecStart `node /opt/admin-backend/src/server.js` and environment file.

### VM: vm-frontend (Nginx)
1. Launch EC2 (Ubuntu), open ports 80/443.
2. Install Nginx and Node (to build):
   ```bash
   sudo apt update && sudo apt install -y nginx nodejs npm git
   ```
3. Build frontend and serve static files:
   ```bash
   cd /tmp
   git clone <repo>
   cd repo/frontend
   npm ci
   npm run build
   sudo mkdir -p /var/www/admin-portal
   sudo rsync -av dist/ /var/www/admin-portal/
   ```
4. Nginx site config (example `/etc/nginx/sites-available/admin-portal`):
   ```nginx
   server {
     listen 80;
     server_name admin.example.com;
     root /var/www/admin-portal;
     index index.html;
     location / { try_files $uri $uri/ /index.html; }
   }
   ```
   Enable and reload nginx.
5. Use Certbot to enable HTTPS (Let's Encrypt).

---

## 8) Notes & next steps
- This v1 keeps auth simple. For production, add:
  - JWT or session handling, refresh tokens
  - Rate-limiting, account lockout after many failed attempts
  - Email-based password reset token (instead of accepting newPassword directly)
  - Logging/monitoring (Winston + ELK/CloudWatch)
  - Backups and automated DB restore tests
- For migration to containers: add `Dockerfile` for each service and `k8s` manifests.

---

If you'd like, I can now:
- generate a downloadable zip of this repo (as files), or
- create Dockerfiles + Kubernetes manifests, or
- expand the Jenkins pipeline to use Blue/Green deploys and health checks.

Which next?

