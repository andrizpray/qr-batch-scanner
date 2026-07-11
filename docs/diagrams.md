# QR Batch Scanner — Documentation

**Project:** https://github.com/andrizpray/qr-batch-scanner  
**Tanggal:** 2026-07-12

---

## 📊 System Architecture

```mermaid
flowchart TB
    subgraph Mobile["📱 Mobile (PWA)"]
        M1[("🏠 BatchList")]
        M2[("📷 Scanner")]
        M3[("📜 ScanHistory")]
    end

    subgraph Server["☁️ Server — Node.js API"]
        API[("🔌 Express API")]
        DB[("🗄️ SQLite")]
    end

    subgraph Admin["💻 Admin Dashboard"]
        A1[("📊 Dashboard")]
        A2[("📋 BatchDetail")]
    end

    M1 -->|"POST /api/batches\n(PIN auth)"| API
    M1 -->|"GET /api/batches"| API
    M2 -->|"POST /api/scans\n(PIN auth)"| API
    M3 -->|"GET /scans/batch/:id"| API
    API --> DB
    DB --> API
    A1 -->|"GET /api/batches\n(Basic Auth)"| API
    A1 -->|"GET /api/exports/:id\n(Basic Auth)"| API
    A2 -->|"GET /scans/batch/:id"| API
    API -->|"📥 Excel Download"| A1
    API -->|"📥 Excel Download"| A2
```

---

## 🔄 User Flow

```mermaid
sequenceDiagram
    participant User as 👤 Mobile User
    participant App as 📱 PWA App
    participant API as 🔌 Server API
    participant DB as 🗄️ SQLite
    participant Admin as 💻 Admin

    Note over User,Admin: MOBILE USER — SCAN FLOW

    User->>App: Buka app (homescreen)
    App->>User: Tampilkan BatchList
    User->>App: Buat Batch baru (nama batch)
    App->>API: POST /api/batches {name}
    API->>DB: INSERT batch
    DB->>API: batch created
    API->>App: 201 Created
    App->>User: Batch muncul di list

    User->>App: Tap "Scan" di batch
    App->>User: Buka kamera scanner
    User->>App: Scan QR code (LotID)
    App->>API: POST /api/scans {batch_id, lot_id}
    API->>DB: INSERT scan + UPDATE scan_count
    DB->>API: scan saved
    API->>App: 201 Created
    App->>User: ✅ "Tersimpan: LOT-XXX"

    Note over User,Admin: ADMIN — DOWNLOAD FLOW

    Admin->>App: Buka /admin
    App->>Admin: Tampilkan login form
    Admin->>App: Input username + password
    App->>API: GET /api/batches (Basic Auth)
    API->>Admin: Lista batch
    Admin->>App: Pilih batch → "Download Excel"
    App->>API: GET /api/exports/:id (Basic Auth)
    API->>DB: SELECT scans WHERE batch_id
    DB->>API: scan data
    API->>Admin: 📥 Excel file (filename = batch_name.xlsx)
```

---

## 🗄️ Data Model

```mermaid
erDiagram
    batches {
        int id PK
        string name
        datetime created_at
        int scan_count
    }

    scans {
        int id PK
        int batch_id FK
        string lot_id
        datetime scanned_at
    }

    batches ||--o{ scans : "has many"
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/batches` | X-PIN (mobile) | Create new batch |
| `GET` | `/api/batches` | Basic Auth (admin) | List all batches |
| `GET` | `/api/batches/:id` | Basic Auth (admin) | Get batch detail |
| `PUT` | `/api/batches/:id` | Basic Auth (admin) | Update batch name |
| `DELETE` | `/api/batches/:id` | Basic Auth (admin) | Delete batch + scans |
| `POST` | `/api/scans` | X-PIN (mobile) | Add scan to batch |
| `GET` | `/api/scans/batch/:batch_id` | Basic Auth (admin) | Get scans in batch |
| `GET` | `/api/exports/:batchId` | Basic Auth (admin) | Download Excel (batch) |
| `GET` | `/api/exports/all` | Basic Auth (admin) | Download Excel (all) |

---

## 🔐 Authentication

### Mobile (PWA)
- **Method:** X-PIN header
- **Default PIN:** `1234`
- **Usage:** Set PIN di app mobile, disimpan di localStorage

### Admin Dashboard
- **Method:** HTTP Basic Authentication
- **Default:** `admin` / `admin123`
- **Usage:** Login form di `/admin`

---

## 📁 Project Structure

```
qr-batch-scanner/
├── server/
│   ├── index.js           # Express app entry
│   ├── db.js              # SQLite init + migrations
│   ├── .env               # Environment variables
│   ├── .env.example       # Env template
│   ├── routes/
│   │   ├── batches.js     # Batches CRUD
│   │   ├── scans.js       # Scans endpoints
│   │   └── exports.js     # Excel export
│   └── middleware/
│       └── auth.js        # PIN + Basic Auth
├── client/
│   ├── src/
│   │   ├── views/
│   │   │   ├── Mobile/
│   │   │   │   ├── BatchList.vue
│   │   │   │   ├── Scanner.vue
│   │   │   │   └── ScanHistory.vue
│   │   │   └── Admin/
│   │   │       ├── Dashboard.vue
│   │   │       └── BatchDetail.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   └── composables/
│   │       └── useApi.ts
│   ├── dist/              # Production build
│   └── public/            # PWA icons
├── docs/
│   └── diagrams.md        # This file
└── README.md               # Deployment guide
```

---

## 🚀 Deployment

### Quick Deploy (VPS)

```bash
# 1. Clone & install
git clone https://github.com/andrizpray/qr-batch-scanner.git
cd qr-batch-scanner
npm install

# 2. Setup env
cp server/.env.example server/.env
nano server/.env  # edit PIN & passwords

# 3. Build frontend
npm run build

# 4. Start with PM2
pm2 start server/index.js --name qr-scanner-server
pm2 startup  # auto-start on reboot
pm2 save     # save current state
```

### Nginx (Subdomain)

```nginx
server {
    listen 80;
    server_name scan.yourdomain.com;

    root /path/to/qr-batch-scanner/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Nginx (Subdirectory)

```nginx
location /scan {
    alias /path/to/qr-batch-scanner/client/dist;
    try_files $uri $uri/ /scan/index.html;
}

location /scan/api {
    proxy_pass http://127.0.0.1:3000;
}
```
