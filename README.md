## Manual deploy steps (detailed)

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