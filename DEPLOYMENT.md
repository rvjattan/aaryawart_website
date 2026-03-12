# Deployment & Production Setup Guide

This guide covers deploying the Charity Website to production environments.

## Prerequisites

- Node.js 14+ and npm
- MySQL 5.7+ or MariaDB
- A domain name (optional, for SSL setup)
- SMTP service (SendGrid, AWS SES, etc.)
- SSL certificate (Let's Encrypt for free)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repo-url> charity-website
cd charity-website
npm install --production
```

### 2. Configure Environment

Create `.env` with production values:

```bash
# Database
DB_HOST=prod-mysql.example.com
DB_USER=charity_prod
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=charity_org

# Security
JWT_SECRET=VERY_LONG_RANDOM_STRING_MIN_32_CHARS
SESSION_SECRET=ANOTHER_LONG_RANDOM_STRING

# Email (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.YOUR_SENDGRID_KEY
SMTP_FROM_EMAIL=noreply@yourdomain.org

# App
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.org
```

### 3. Database Setup

```bash
# Create database and user
mysql -u root -p mysql
CREATE DATABASE charity_org CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'charity_prod'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON charity_org.* TO 'charity_prod'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u charity_prod -p charity_org < db/schema.sql

# Create admin user
npm run seed-admin -- --username=admin --email=admin@yourdomain.org --password=STRONG_ADMIN_PASSWORD
```

## Deployment Options

### Option A: Linux Server (VPS/Dedicated)

#### Using systemd (recommended)

1. **Copy files to server**
   ```bash
   scp -r charity-website/ user@server:/var/www/charity-website
   cd /var/www/charity-website
   npm install --production
   ```

2. **Create systemd service**
   ```bash
   sudo nano /etc/systemd/system/charity-website.service
   ```

   ```ini
   [Unit]
   Description=Charity Website App
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/charity-website
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=10
   Environment="NODE_ENV=production"
   EnvironmentFile=/var/www/charity-website/.env

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start service**
   ```bash
   sudo systemctl enable charity-website
   sudo systemctl start charity-website
   sudo systemctl status charity-website
   ```

4. **Configure Nginx reverse proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/charity-website
   ```

   ```nginx
   server {
     listen 80;
     server_name yourdomain.org www.yourdomain.org;
     return 301 https://$server_name$request_uri;
   }

   server {
     listen 443 ssl http2;
     server_name yourdomain.org www.yourdomain.org;

     ssl_certificate /etc/letsencrypt/live/yourdomain.org/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.org/privkey.pem;
     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_ciphers HIGH:!aNULL:!MD5;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }

     location /uploads/ {
       alias /var/www/charity-website/uploads/;
       expires 30d;
     }

     location /static/ {
       alias /var/www/charity-website/public/;
       expires 30d;
     }
   }
   ```

5. **Enable site and SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/charity-website /etc/nginx/sites-enabled/
   sudo certbot certonly --nginx -d yourdomain.org -d www.yourdomain.org
   sudo systemctl restart nginx
   ```

#### Using PM2 (alternative)

```bash
npm install -g pm2
pm2 start server.js --name "charity-website" --env production
pm2 startup
pm2 save
```

### Option B: Heroku

1. **Create Heroku account and install CLI**
2. **Add Procfile**
   ```
   echo "web: node server.js" > Procfile
   ```

3. **Create and configure app**
   ```bash
   heroku create charity-website
   heroku addons:create cleardb:ignite  # MySQL
   heroku config:set JWT_SECRET=YOUR_SECRET
   # Set other env vars...
   git push heroku main
   ```

### Option C: Docker

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: charity_org
    volumes:
      - ./db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Database backups scheduled (daily)
- [ ] SMTP service tested and sender domain verified
- [ ] Admin user created and login verified
- [ ] Public pages load correctly
- [ ] Volunteer registration form tested
- [ ] Admin panel fully accessible
- [ ] Logs monitored (check `/var/log/syslog` or PM2 logs)
- [ ] CDN configured for static assets (optional)
- [ ] Email notifications tested
- [ ] Sitemap.xml and robots.txt updated

## Monitoring & Maintenance

### Health checks
```bash
curl https://yourdomain.org/
curl https://yourdomain.org/admin/login
```

### Database backups
```bash
# Daily backup script
0 2 * * * mysqldump -u charity_prod -p$DB_PASSWORD charity_org | gzip > /backups/charity_org_$(date +\%Y\%m\%d).sql.gz
```

### Log rotation
```bash
# Create /etc/logrotate.d/charity-website
/var/www/charity-website/logs/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
}
```

## Troubleshooting

### Database connection error
- Verify credentials in `.env`
- Check MySQL service is running
- Confirm network connectivity to DB server

### SMTP issues
- Test with `npm run test:email`
- Verify sender domain is registered with SMTP provider
- Check firewall allows outgoing port 587

### High memory usage
- Check for memory leaks: `node --inspect server.js`
- Monitor with PM2: `pm2 logs`
- Consider clustering for multiple cores

## Security Hardening

1. **Firewall rules**
   - Only allow HTTP/HTTPS (ports 80, 443)
   - SSH on non-standard port (2222)
   - Restrict admin IPs if possible

2. **Regular updates**
   ```bash
   npm audit fix
   npm update
   ```

3. **Rate limiting** (add to server.js)
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   app.use(limiter);
   ```

4. **CORS configuration**
   - Restrict origins in production
   - Remove unnecessary API endpoints

5. **Database user privileges**
   - Limit to app database only
   - Use read-only user for backups
   - Rotate credentials regularly

## Support & Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
