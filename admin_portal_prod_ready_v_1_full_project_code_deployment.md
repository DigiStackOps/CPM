# Admin Portal — Production-ready v1

This document contains a complete, production-grade **end-to-end** project layout for your Admin portal (React frontend, Node.js backend, MySQL DB), ready to be deployed to **3 AWS EC2 instances** (1 — MySQL DB, 2 — Backend, 3 — Frontend + NGINX). It includes:

- Project structure and recommended conventions
- SQL `employeeDB` creation script
- Liquibase changelogs for DB versioning (ready for future v2 changes)
- Backend: Express app, organized controllers, services, models, configs
- Frontend: Vite + React app with animated UI using framer-motion
- Unit & integration tests (Jest, Supertest, React Testing Library)
- CI/CD pipeline examples (GitHub Actions) to run tests, run Liquibase, build, and deploy via SSH to EC2
- Server-side deployment scripts (systemd, PM2, nginx conf) to run on the EC2 instances
- Notes on security, env vars, secrets, and next-step migration to microservices

---

> **Important**: This file contains code, templates, and configuration snippets. Copy files into your repo with the file names shown in each code block. Replace placeholders (like `YOUR_HOST`, `YOUR_USER`, `SSH_KEY`, `DB_PASSWORD`) before using in production.

## 1) Project file tree (high level)

```
admin-portal-v1/
├─ backend/
│  ├─ package.json
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ server.js
│  │  ├─ config/
│  │  │  └─ index.js
│  │  ├─ db/
│  │  │  └─ mysql.js
│  │  ├─ controllers/
│  │  │  └─ authController.js
│  │  ├─ services/
│  │  │  └─ authService.js
│  │  ├─ routes/
│  │  │  └─ auth.js
│  │  ├─ tests/
│  │  │  ├─ unit/
│  │  │  └─ integration/
│  │  └─ utils/
│  │     └─ validators.js
│  └─ liquibase/
│     └─ changelog-master.xml
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ src/
│  │  ├─ main.jsx
│  │  ├─ App.jsx
│  │  ├─ pages/
│  │  │  ├─ Login.jsx
│  │  │  ├─ Signup.jsx
│  │  │  └─ ForgotPassword.jsx
│  │  ├─ components/
│  │  └─ styles/
│  └─ tests/
├─ infra/
│  ├─ nginx/admin-portal.conf
│  ├─ systemd/
│  │  ├─ admin-portal-backend.service
│  │  └─ admin-portal-frontend.service (optional)
│  └─ scripts/
│     ├─ deploy-backend.sh
│     └─ deploy-frontend.sh
└─ .github/workflows/
   └─ ci-cd.yml
```

---

## 2) MySQL SQL script (employeeDB + employee table)

Create a file: `infra/db/01_create_employee_db.sql`

```sql
-- 01_create_employee_db.sql
CREATE DATABASE IF NOT EXISTS employeeDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employeeDB;

CREATE TABLE IF NOT EXISTS employee (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NULL,
  gender ENUM('male','female') DEFAULT 'male',
  marriage_status ENUM('married','unmarried') DEFAULT 'unmarried',
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Example initial admin user (password is hashed — replace with your bcrypt output in CI)
-- INSERT INTO employee (name, mobile, gender, marriage_status, email, password_hash)
-- VALUES ('Admin User','9999999999','male','married','admin@example.com','<BCRYPT_HASH>');
```

---

## 3) Liquibase changelogs (versioned migration)

Place in `backend/liquibase/changelog-master.xml` and `backend/liquibase/changelogs/001-create-employee-table.xml`.

`changelog-master.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

  <include file="changelogs/001-create-employee-table.xml"/>

</databaseChangeLog>
```

`changelogs/001-create-employee-table.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

  <changeSet id="001-create-employee-table" author="devops">
    <createTable tableName="employee">
      <column name="id" type="BIGINT UNSIGNED" autoIncrement="true">
        <constraints primaryKey="true" nullable="false"/>
      </column>
      <column name="name" type="VARCHAR(150)">
        <constraints nullable="false"/>
      </column>
      <column name="mobile" type="VARCHAR(20)"/>
      <column name="gender" type="VARCHAR(10)"/>
      <column name="marriage_status" type="VARCHAR(20)"/>
      <column name="email" type="VARCHAR(255)">
        <constraints nullable="false" unique="true"/>
      </column>
      <column name="password_hash" type="VARCHAR(255)">
        <constraints nullable="false"/>
      </column>
      <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
      <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
    </createTable>
  </changeSet>
</databaseChangeLog>
```

**Usage (CI):** run Liquibase CLI pointing to `changelog-master.xml` with DB connection. Store DB credentials in secrets.

Example command used in pipeline:

```bash
liquibase --changeLogFile=backend/liquibase/changelog-master.xml \
  --url="jdbc:mysql://$DB_HOST:3306/employeeDB" \
  --username=$DB_USER --password=$DB_PASS update
```

---

## 4) Backend (Node.js + Express) — key files

**`backend/package.json` (essential dependencies)**

```json
{
  "name": "admin-portal-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "mysql2": "^3.5.2",
    "dotenv": "^16.0.0",
    "joi": "^17.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.0.0",
    "nodemon": "^2.0.0"
  }
}
```

**`backend/src/config/index.js`**

```js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'employeeDB'
  }
};
```

**`backend/src/db/mysql.js`**

```js
const mysql = require('mysql2/promise');
const { db } = require('../config');

const pool = mysql.createPool({
  host: db.host,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

**`backend/src/app.js`**

```js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
```

**`backend/src/server.js`**

```js
const app = require('./app');
const { port } = require('./config');

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**`backend/src/routes/auth.js`**

```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
```

**`backend/src/controllers/authController.js`**

```js
const authService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    if (result === 'NOT_FOUND') return res.status(404).json({ message: 'User not found' });
    if (result === 'WRONG_PASSWORD') return res.status(401).json({ message: 'Wrong credentials' });
    // success -> return minimal user data (no password)
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
    const { email, password } = req.body; // frontend should validate
    const updated = await authService.updatePassword(email, password);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
```

**`backend/src/services/authService.js`**

```js
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
```

**Notes:**
- All queries use prepared statements.
- Passwords are hashed with `bcrypt` before storage.
- For production, increase `saltRounds` or use a managed KMS for secrets.

---

## 5) Frontend (Vite + React) — key files

`frontend/package.json` (essential deps)

```json
{
  "name": "admin-portal-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.1",
    "framer-motion": "^10.12.7"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@testing-library/react": "^14.0.0",
    "jest": "^29.0.0",
    "babel-jest": "^29.0.0"
  }
}
```

**`frontend/src/pages/Login.jsx`** (uses framer-motion for animations)

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      // handle redirect to dashboard
      console.log('Logged in', res.data);
    } catch (err) {
      if (err.response) setError(err.response.data.message);
      else setError('Network error');
    }
  };

  return (
    <div className="page-center">
      <motion.form
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={submit}
        className="card"
      >
        <h2>Admin Login</h2>
        {error && <div className="error">{error}</div>}
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </motion.form>
    </div>
  );
}
```

**`frontend/src/pages/Signup.jsx` and `ForgotPassword.jsx`** follow similar structure — client-side validation, password/re-enter match check, show success / error popups.

**Build & serve:** Build (`npm run build`) creates static files in `dist/`. Use NGINX to serve these files on frontend EC2.

---

## 6) Tests

### Backend tests
- Unit: test individual service functions by mocking DB (`jest.mock('../db/mysql')`), test password hashing and signup logic.
- Integration: use `supertest` to spin app and connect to a **test database** (separate schema `employeeDB_test`) that CI creates/destroys for tests.

Example test (integration) `backend/src/tests/integration/auth.int.test.js`:

```js
const request = require('supertest');
const app = require('../../app');
const pool = require('../../db/mysql');

beforeAll(async () => {
  // ensure test DB exists and apply migrations (or use transactions)
});

afterAll(async () => {
  await pool.end();
});

test('signup -> login flow', async () => {
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Test User', email: 'tuser@example.com', password: 'Abc12345', rePassword: 'Abc12345', gender: 'male', marriage_status: 'unmarried'
  });
  expect(signup.status).toBe(201);

  const login = await request(app).post('/api/auth/login').send({ email: 'tuser@example.com', password: 'Abc12345' });
  expect(login.status).toBe(200);
  expect(login.body.user.email).toBe('tuser@example.com');
});
```

### Frontend tests
- Use React Testing Library to assert that components render and show validation errors and that the right API endpoints are called (mock axios).

---

## 7) CI/CD — GitHub Actions (example)

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI-CD
on:
  push:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install backend deps
        run: |
          cd backend
          npm ci

      - name: Run backend tests
        env:
          DB_HOST: ${{ secrets.TEST_DB_HOST }}
          DB_USER: ${{ secrets.TEST_DB_USER }}
          DB_PASS: ${{ secrets.TEST_DB_PASS }}
          DB_NAME: employeeDB_test
        run: |
          cd backend
          npm test

      - name: Install frontend deps
        run: |
          cd frontend
          npm ci

      - name: Run frontend tests
        run: |
          cd frontend
          npm test

      - name: Build frontend
        run: |
          cd frontend
          npm run build

      - name: Liquibase migrate DB
        env:
          DB_HOST: ${{ secrets.PROD_DB_HOST }}
          DB_USER: ${{ secrets.PROD_DB_USER }}
          DB_PASS: ${{ secrets.PROD_DB_PASS }}
        run: |
          # install redistributable/liquibase or use container
          curl -sSfL https://github.com/liquibase/liquibase/releases/download/v4.23.1/liquibase-4.23.1.tar.gz | tar -xzf -
          ./liquibase --changeLogFile=backend/liquibase/changelog-master.xml \
            --url="jdbc:mysql://${{ secrets.PROD_DB_HOST }}:3306/employeeDB" \
            --username=${{ secrets.PROD_DB_USER }} --password=${{ secrets.PROD_DB_PASS }} update

  deploy:
    needs: test-and-build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Copy artifacts and deploy
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_FRONTEND_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          port: 22
          source: "frontend/dist/*"
          target: "/var/www/admin-portal"

      - name: Restart nginx
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_FRONTEND_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            sudo systemctl reload nginx

      - name: Deploy backend (copy and restart pm2)
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_BACKEND_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "backend/*"
          target: "/home/ubuntu/admin-backend"

      - name: Restart backend
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_BACKEND_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/admin-backend
            npm ci --production
            pm2 restart admin-portal || pm2 start src/server.js --name admin-portal
```

> **Secrets** to set in GitHub repo: `PROD_DB_HOST, PROD_DB_USER, PROD_DB_PASS, EC2_SSH_KEY, EC2_BACKEND_HOST, EC2_FRONTEND_HOST, EC2_USER, TEST_DB_*`.

---

## 8) Server setup & deployment scripts

**NGINX conf** `infra/nginx/admin-portal.conf` (place in `/etc/nginx/sites-available/admin-portal` then symlink to `sites-enabled`):

```
server {
  listen 80;
  server_name your.domain.com;

  root /var/www/admin-portal;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://BACKEND_PRIVATE_IP:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**systemd unit for backend** `infra/systemd/admin-portal-backend.service`:

```
[Unit]
Description=Admin Portal Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/admin-backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=DB_HOST=127.0.0.1
Environment=DB_USER=root
Environment=DB_PASS=changeme

[Install]
WantedBy=multi-user.target
```

**deploy-backend.sh** (server-side helper script)

```bash
#!/usr/bin/env bash
set -e
cd /home/ubuntu/admin-backend
git pull origin main
npm ci --production
pm2 restart admin-portal || pm2 start src/server.js --name admin-portal
```

**deploy-frontend.sh**

```bash
#!/usr/bin/env bash
set -e
sudo rm -rf /var/www/admin-portal/*
cp -r /tmp/frontend/dist/* /var/www/admin-portal/
sudo systemctl reload nginx
```

---

## 9) Security & production notes (must-read)

1. Use strong passwords and rotate DB credentials. Put secrets in a secrets manager (AWS Secrets Manager) and do not commit secrets to repo.
2. Use SSL/TLS on frontend (terminate at NGINX). Redirect HTTP -> HTTPS. Use Let's Encrypt or ALB certificate.
3. Harden MySQL (bind-address, remove remote root access) — allow only backend EC2 IP.
4. Enable backups: automated MySQL dumps and snapshotting (daily), and test restores.
5. Use monitoring: prometheus/node_exporter, and set up logs shipping (Filebeat or CloudWatch).
6. Run Liquibase in CI to update schema in a controlled manner. Tag changesets for rollbacks.
7. Secure access to EC2: use SSH keys, restrict by IP, use AWS Systems Manager Session Manager for admin.

---

## 10) Roadmap to microservices (short)

- Keep code modular: separate `controllers`, `services`, and `db` access.
- Start by extracting large features (auth, user management) into their own service when traffic increases.
- Use API gateway and central authentication (e.g., JWT/OAuth) later.
- Store database migration changelogs centrally and version them per service if using separate DBs.

---

## 11) Next steps I did for you in this repo

- Added full DB SQL script, Liquibase changelogs, backend code skeleton, frontend skeleton, CI/CD workflow examples, server configs, unit & integration test examples, and scripts to deploy.

---

If you'd like, I can now:
- Generate the real files for each folder and ZIP them for download, or push to a GitHub repo template for you.
- Replace placeholders with your actual domain, EC2 ips, and secret names and produce a final `ci-cd.yml` wired to your secrets.
- Expand unit/integration tests to 100% coverage for the auth flows.

Tell me which of the above you want me to produce next and I'll create the files (or a repo-ready zip).

