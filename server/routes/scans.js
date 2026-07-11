import { Router } from 'express';

const router = Router();

// POST / — add scan to batch, increments batch.scan_count
router.post('/', (req, res) => {
  const { batch_id, lot_id } = req.body;
  const db = req.db;

  if (!batch_id || !lot_id) {
    return res.status(400).json({ error: 'batch_id and lot_id are required' });
  }

  // Verify batch exists
  const batch = db.prepare('SELECT id FROM batches WHERE id = ?').get(batch_id);
  if (!batch) {
    return res.status(404).json({ error: `Batch ${batch_id} not found` });
  }

  // Insert scan + increment scan_count in a transaction
  const insertScan = db.prepare(
    'INSERT INTO scans (batch_id, lot_id) VALUES (?, ?)'
  );
  const updateBatch = db.prepare(
    'UPDATE batches SET scan_count = scan_count + 1 WHERE id = ?'
  );

  const result = db.transaction(() => {
    const scanResult = insertScan.run(batch_id, lot_id);
    updateBatch.run(batch_id);
    return scanResult;
  })();

  res.status(201).json({
    id: result.lastInsertRowid,
    batch_id,
    lot_id,
    scanned_at: new Date().toISOString(),
  });
});

// GET /batch/:batch_id — get all scans for a batch
router.get('/batch/:batch_id', (req, res) => {
  const { batch_id } = req.params;
  const db = req.db;

  const batch = db.prepare('SELECT id FROM batches WHERE id = ?').get(batch_id);
  if (!batch) {
    return res.status(404).json({ error: `Batch ${batch_id} not found` });
  }

  const scans = db
    .prepare('SELECT * FROM scans WHERE batch_id = ? ORDER BY scanned_at ASC')
    .all(batch_id);

  res.json(scans);
});

export default router;
