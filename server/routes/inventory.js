import express from 'express';
import Inventory from '../models/Inventory.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── GET all inventory ─────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, brand, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (brand)    query.brand    = brand;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku:   { $regex: search, $options: 'i' } },
      ];
    }

    const inventory = await Inventory.find(query).sort({ createdAt: -1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET single item ───────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST create item ──────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Guard: costPrice must be provided and > 0 for stock value to be meaningful
    if (req.body.costPrice === undefined || req.body.costPrice === null) {
      return res.status(400).json({ message: 'costPrice is required' });
    }
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT full update ───────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH update quantity only ────────────────────────────
router.patch('/:id/quantity', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ message: 'quantity is required' });
    }
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE item ───────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /migrate/set-cost-price ──────────────────────────
// One-time migration: for every item where costPrice is 0,
// set it to a percentage of the selling price (default 60%).
// Call once from the browser or Postman — safe to call multiple times.
router.post('/migrate/set-cost-price', authMiddleware, async (req, res) => {
  try {
    const { marginPct = 40 } = req.body;
    // costPrice = price * (1 - marginPct/100)
    // e.g. if selling price = 1000 and marginPct = 40, costPrice = 600
    const costFactor = 1 - (marginPct / 100);

    const items = await Inventory.find({ costPrice: { $in: [0, null] } });

    if (items.length === 0) {
      return res.json({ message: 'All items already have costPrice set', updated: 0 });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { costPrice: Math.round(item.price * costFactor) } },
      },
    }));

    const result = await Inventory.bulkWrite(bulkOps);

    res.json({
      message: `Updated costPrice for ${result.modifiedCount} items`,
      updated: result.modifiedCount,
      rule: `costPrice = sellingPrice × ${(costFactor * 100).toFixed(0)}%`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
