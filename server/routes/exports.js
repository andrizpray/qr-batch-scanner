import { Router } from 'express';
import ExcelJS from 'exceljs';

const router = Router();

function streamExcelToResponse(res, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  return res;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

// GET /api/exports/all - Export all scans to Excel
router.get('/all', (req, res) => {
  const db = req.db;

  const batches = db.prepare('SELECT id, name FROM batches ORDER BY created_at DESC').all();
  const scans = db.prepare(`
    SELECT s.id, s.lot_id, s.scanned_at, b.name as batch_name, b.id as batch_id
    FROM scans s
    JOIN batches b ON s.batch_id = b.id
    ORDER BY s.scanned_at DESC
  `).all();

  const filename = sanitizeFilename(`all-scans-${new Date().toISOString().slice(0, 10)}`);
  streamExcelToResponse(res, filename);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const worksheet = workbook.addWorksheet('All Scans');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Batch ID', key: 'batch_id', width: 10 },
    { header: 'Batch Name', key: 'batch_name', width: 25 },
    { header: 'Lot ID', key: 'lot_id', width: 20 },
    { header: 'Scanned At', key: 'scanned_at', width: 25 },
  ];

  for (const scan of scans) {
    worksheet.addRow(scan).commit();
  }

  worksheet.commit();
  workbook.commit();
});

// GET /api/exports/:batchId - Export a single batch to Excel
router.get('/:batchId', (req, res) => {
  const db = req.db;
  const { batchId } = req.params;

  const batch = db.prepare('SELECT id, name FROM batches WHERE id = ?').get(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  const scans = db.prepare(`
    SELECT id, lot_id, scanned_at
    FROM scans
    WHERE batch_id = ?
    ORDER BY scanned_at ASC
  `).all(batchId);

  const filename = sanitizeFilename(batch.name);
  streamExcelToResponse(res, filename);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const worksheet = workbook.addWorksheet(batch.name);

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Lot ID', key: 'lot_id', width: 20 },
    { header: 'Scanned At', key: 'scanned_at', width: 25 },
  ];

  for (const scan of scans) {
    worksheet.addRow(scan).commit();
  }

  worksheet.commit();
  workbook.commit();
});

export default router;
