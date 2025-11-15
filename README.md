# Admin Portal — Minimal End-to-End Project (v1)
This archive contains a minimal but runnable skeleton for:
- backend: Node.js + Express + MySQL (uses mysql2)
- frontend: Vite + React + Framer Motion
- Liquibase changelogs and SQL script in backend/ and infra/
- Example integration test for the backend (supertest + jest)

Important:
- Replace environment variables before running (DB credentials).
- Run `npm install` in backend and frontend folders.
- Build frontend (`npm run build`) and serve `frontend/dist` via nginx in production.
- Use liquibase or the provided SQL to initialize the database.

Example local run (dev):
1. Start MySQL and create database using infra_db_create.sql
2. In backend: `npm install` then `DB_HOST=127.0.0.1 DB_USER=root DB_PASS= your_password DB_NAME=employeeDB node src/server.js`
3. In frontend: `npm install` then `npm run dev` (or `npm run build` to generate `dist`)
