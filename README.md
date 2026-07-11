# QR Batch Scanner — Deployment Guide

## Prerequisites

- Node.js 18+
- PM2 (`npm install -g pm2`)
- Nginx
- SQLite3

---

## 1. Build the Frontend

```bash
cd client
npm install
npm run build
```

The compiled assets will be in `client/dist/`.

---

## 2. Start the Server with PM2

```bash
cd server
npm install
pm2 start index.js --name qr-scanner-server
```

To start on system boot:

```bash
pm2 startup
pm2 save
```

Useful PM2 commands:

```bash
pm2 status              # check status
pm2 logs qr-scanner-server  # view logs
pm2 restart qr-scanner-server
pm2 stop qr-scanner-server
```

---

## 3. Nginx Reverse Proxy Configuration

**Vue app at `/` — API at `/api`:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/qr-batch-scanner/client/dist;
    index index.html;

    # Vue app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

After editing, test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, wrap in a `server { listen 443 ssl ... }` block and use `certbot --nginx`.

---

## 4. Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

| Variable      | Description                  | Default |
|---------------|------------------------------|---------|
| `PORT`        | Server port                  | `3000`  |
| `MOBILE_PIN`  | PIN for mobile device auth   | —       |
| `ADMIN_USER`  | Admin dashboard username     | —       |
| `ADMIN_PASS`  | Admin dashboard password     | —       |

**Example `.env`:**

```env
PORT=3000
MOBILE_PIN=123456
ADMIN_USER=admin
ADMIN_PASS=your-secure-password
```

> **Security note:** Use strong, unique values for `MOBILE_PIN`, `ADMIN_USER`, and `ADMIN_PASS`. Do not commit `.env` to version control.

---

## 5. Updating

```bash
# Pull latest code
git pull

# Rebuild frontend
cd client && npm run build && cd ..

# Restart server
pm2 restart qr-scanner-server
```
