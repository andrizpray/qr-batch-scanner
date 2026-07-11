import { Router } from 'express';
import { mobileAuth, adminAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/batches — Create a new batch (mobile auth)
router.post('/', mobileAuth, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const stmt = req.db.prepare('INSERT INTO batches (name) VALUES (?)');
  const result = stmt.run(name);
  const batch = req.db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(batch);
});

// GET /api/batches — List all batches (admin auth)
router.get('/', adminAuth, (req, res) => {
  const batches = req.db.prepare('SELECT * FROM batches ORDER BY created_at DESC').all();
  res.json(batches);
});

// GET /api/batches/:id — Get a single batch (admin auth)
router.get('/:id', adminAuth, (req, res) => {
  const batch = req.db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  res.json(batch);
});

// PUT /api/batches/:id — Update a batch (admin auth)
router.put('/:id', adminAuth, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const stmt = req.db.prepare('UPDATE batches SET name = ? WHERE id = ?');
  const result = stmt.run(name, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  const batch = req.db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  res.json(batch);
});

// DELETE /api/batches/:id — Delete a batch (admin auth)
router.delete('/:id', adminAuth, (req, res) => {
  const stmt = req.db.prepare('DELETE FROM batches WHERE id = ?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  res.status(204).send();
});

export default router;
