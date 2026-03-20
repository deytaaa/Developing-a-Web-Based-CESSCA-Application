# Deployment Guide - CESSCA Web Application

## Production Deployment

This guide covers deploying the CESSCA application to a production environment.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Root or sudo access

## Server Requirements

### Minimum Specifications
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04 LTS or higher

### Recommended Specifications
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 50GB SSD

## Step 1: Server Setup

### Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Install Required Software
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Secure MySQL
```bash
sudo mysql_secure_installation
```

## Step 2: Database Setup

### Create Production Database
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE cessca_prod;
CREATE USER 'cessca_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON cessca_prod.* TO 'cessca_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Import Schema
```bash
mysql -u cessca_user -p cessca_prod < database/schema.sql
```

## Step 3: Application Deployment

### Clone Repository
```bash
cd /var/www
sudo git clone <your-repo-url> cessca
cd cessca
sudo chown -R $USER:$USER /var/www/cessca
```

### Backend Deployment

```bash
cd backend

# Install dependencies
npm install --production

# Create production .env
nano .env
```

**Production `.env`:**
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_USER=cessca_user
DB_PASSWORD=your_strong_password
DB_NAME=cessca_prod
DB_PORT=3306

# JWT Secret (Generate strong secret!)
JWT_SECRET=your_very_long_and_random_secret_key_here
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/var/www/cessca/backend/uploads

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Create Uploads Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### Start Backend with PM2
```bash
pm2 start server.js --name cessca-backend
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
cd ../frontend

# Install dependencies
npm install

# Update API URL for production
nano .env
```

**Production `.env`:**
```env
VITE_API_URL=https://yourdomain.com/api
```

### Build Frontend
```bash
npm run build
```

## Step 4: Nginx Configuration

### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/cessca
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (after obtaining certificate)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    root /var/www/cessca/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        alias /var/www/cessca/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/cessca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal
Certbot automatically creates a cron job. Verify:
```bash
sudo certbot renew --dry-run
```

## Step 6: Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

## Step 7: Monitoring and Maintenance

### View PM2 Status
```bash
pm2 status
pm2 logs cessca-backend
```

### View Nginx Logs
```bash
sudo tail -f /var/nginx/error.log
sudo tail -f /var/nginx/access.log
```

### Database Backup Script
Create `/var/www/cessca/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cessca"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u cessca_user -p'your_password' cessca_prod > \
    $BACKUP_DIR/cessca_backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -name "cessca_backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /var/www/cessca/backup.sh
crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * /var/www/cessca/backup.sh
```

## Step 8: Security Hardening

### MySQL Security
```bash
sudo mysql -u root -p
```

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disallow remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');

-- Reload privileges
FLUSH PRIVILEGES;
```

### Fail2Ban (Protect against brute force)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Environment-Specific Updates

### Update Application
```bash
cd /var/www/cessca
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart cessca-backend

# Frontend
cd ../frontend
npm install
npm run build
```

## Troubleshooting

### Check Backend Status
```bash
pm2 status
pm2 logs cessca-backend --lines 100
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

## Performance Optimization

### Enable MySQL Query Cache
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
query_cache_type = 1
query_cache_size = 16M
```

### PM2 Cluster Mode
```bash
pm2 delete cessca-backend
pm2 start server.js --name cessca-backend -i max
pm2 save
```

## Contact & Support

For deployment issues:
- Email: ptc@paterostechnologicalcollege.edu.ph
- Check logs for error details
- Review Nginx and PM2 documentation
