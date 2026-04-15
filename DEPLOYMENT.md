# Deployment Guide

## Environment Variables

Set these in your production environment:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=<strong-random-64-char-secret>
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=<strong-password>
DATABASE_PATH=/var/data/offices.db
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=5242880
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## VPS / Dedicated Server

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/your-username/office-cms.git /var/www/office-cms
cd /var/www/office-cms
npm install --production

# Create .env with production values
cp .env.example .env
nano .env

# Start with PM2
npm install -g pm2
pm2 start server.js --name office-cms
pm2 startup
pm2 save
```

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    location /uploads/ {
        alias /var/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

## SSL/HTTPS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## cPanel Hosting

1. Upload files via File Manager or FTP
2. Create Node.js app in cPanel
3. Set document root to project folder
4. Set startup file to `server.js`
5. Add environment variables in cPanel
6. Install dependencies via cPanel terminal: `npm install`

## Database Backup

```bash
# Backup
cp data/offices.db data/offices-backup-$(date +%Y%m%d).db

# Restore
cp data/offices-backup-YYYYMMDD.db data/offices.db
```

## Monitoring

```bash
# PM2 logs
pm2 logs office-cms

# Application status
pm2 status

# Restart
pm2 restart office-cms
```
