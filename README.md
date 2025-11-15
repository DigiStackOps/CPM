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
Backend
cd backend
cp .env.example .env  # edit DB_ variables
npm ci
npm run dev
Frontend
cd frontend
npm ci
npm run dev
Tests
Backend unit & integration tests:
cd backend
npm test
