# PRD: QR Batch Scanner & Excel Exporter

**Tanggal:** 2026-07-12  
**Status:** Approved  

---

## 1. Overview

**Project Name:** QR Batch Scanner  
**Type:** Full-stack Web Application (PWA Mobile + Admin Dashboard)  
**Core Functionality:** Scan multiple QR codes containing LotID in batch mode, store on server, export to Excel per batch via admin dashboard.  
**Target Users:**
- **Mobile User (Worker):** Scan QR codes in the field/warehouse
- **Admin:** View scan history and download Excel via PC dashboard

---

## 2. User Flow

```
MOBILE (PWA)                      SERVER                   ADMIN DASHBOARD
─────────────                     ───────                   ───────────────
1. Buka app di hp
2. Buat Batch baru                 POST /api/batches
   → Beri nama batch                  → Create batch
3. Scan QR (loop)                  POST /api/scans
   → LotID dikirim ke server            → Save LotID + batch_id
4. Selesai scan
   → Data tersimpan                    ↕
                              ┌──────────────────┐
                              │     SQLite       │
                              │  batches table   │
                              │  scans table     │
                              └──────────────────┘
                                    ↕
5. Lihat semua batch                 GET /api/batches
                                     GET /api/batches/:id/scans
                                     GET /api/exports/:batchId  → Download .xlsx
```

---

## 3. Data Model

**Table: batches**
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER (PK) | Auto increment |
| name | TEXT | Batch name (user-defined) |
| created_at | DATETIME | Timestamp when batch was created |
| scan_count | INTEGER | Cached count of scans in this batch |

**Table: scans**
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER (PK) | Auto increment |
| batch_id | INTEGER (FK) | Reference to batches.id |
| lot_id | TEXT | The scanned LotID (from QR) |
| scanned_at | DATETIME | Timestamp when scanned |

---

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/batches` | Create new batch (`{ name }`) |
| GET | `/api/batches` | List all batches (with scan_count) |
| GET | `/api/batches/:id` | Get batch detail |
| PUT | `/api/batches/:id` | Update batch name |
| DELETE | `/api/batches/:id` | Delete batch + its scans |
| POST | `/api/scans` | Add scan to batch (`{ batch_id, lot_id }`) |
| GET | `/api/batches/:id/scans` | Get all scans in a batch |
| GET | `/api/exports/:id` | Download Excel of a batch |
| GET | `/api/exports/all` | Download Excel of all scans |

---

## 5. Frontend Structure

```
src/
├── views/
│   ├── Mobile/
│   │   ├── BatchList.vue      # List batches, create new
│   │   ├── Scanner.vue        # QR scanner camera view
│   │   └── ScanHistory.vue   # View scans in current batch
│   └── Admin/
│       ├── Dashboard.vue      # Overview + batch list
│       ├── BatchDetail.vue    # Detail + list LotID
│       └── ExportModal.vue    # Download Excel (set filename)
```

**PWA Files:**
- `public/manifest.json` — app metadata + icon
- `public/sw.js` — service worker for offline caching

---

## 6. Tech Stack

| Layer | Tech |
|-------|------|
| Mobile PWA | Vue 3 + TypeScript + Vite + vite-plugin-pwa |
| Admin Dashboard | Vue 3 + TailwindCSS (same repo, different route) |
| Backend API | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Excel Export | ExcelJS |
| QR Scanner | `html5-qrcode` library |

---

## 7. Security

- Admin dashboard: HTTP Basic Auth atau session-based
- Mobile app: simple PIN/password per device
- CORS: whitelist domain lu aja
- Rate limiting di endpoint scan

---

## 8. Approved Features

### Mobile (PWA)
- Create batch (input nama batch)
- Scan QR via camera (batch mode — loop scan)
- View list batch
- View scan history per batch
- Delete batch

### Admin Dashboard
- Daftar semua batch (nama, jumlah scan, tanggal)
- Download Excel per batch (filename = nama batch)
- Download Excel semua data
- Filter/search batch by nama atau tanggal
- Edit nama batch
- Hapus batch
- Lihat detail isi batch (list LotID)
- Pagination

---

## 9. Out of Scope

- User login (multiple workers) — v1 simpel aja
- QR validation format
- Duplicate scan detection
- Print label

---

*Document approved by user on 2026-07-12*
