import express from 'express';
import Sale from '../models/Sale.js';
import Inventory from '../models/Inventory.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── GET all sales (with optional date filter) ─────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, limit, paymentMethod } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // include the full end day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (paymentMethod) query.paymentMethod = paymentMethod;

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit) : 0);

    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET single sale ───────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST create sale ──────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod, customerName, customerPhone, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Sale must have at least one item' });
    }

    // ── 1. Validate stock & fetch current cost prices ──────
    const enrichedItems = [];
    for (const item of items) {
      const inv = await Inventory.findById(item.inventoryId);
      if (!inv) {
        return res.status(404).json({ message: `Product not found: ${item.inventoryId}` });
      }
      if (inv.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${inv.name}". Available: ${inv.quantity}, requested: ${item.quantity}`,
        });
      }

      const sellingPrice = Number(item.sellingPrice ?? item.price ?? inv.price);
      const costPrice    = Number(inv.costPrice);   // always from DB — never trust client
      const discount     = Number(item.discount ?? 0);
      const qty          = Number(item.quantity);

      const subtotal = (sellingPrice - discount) * qty;
      const profit   = (sellingPrice - discount - costPrice) * qty;

      enrichedItems.push({
        inventoryId:  inv._id,
        name:         inv.name,
        sku:          inv.sku ?? '',
        category:     inv.category,
        quantity:     qty,
        costPrice,
        sellingPrice,
        discount,
        subtotal,
        profit,
      });
    }

    // ── 2. Deduct stock ────────────────────────────────────
    for (const item of enrichedItems) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: -item.quantity },
      });
    }

    // ── 3. Compute bill totals ────────────────────────────
    const totalAmount   = enrichedItems.reduce((s, i) => s + i.subtotal, 0);
    const totalCost     = enrichedItems.reduce((s, i) => s + i.costPrice * i.quantity, 0);
    const totalDiscount = enrichedItems.reduce((s, i) => s + i.discount * i.quantity, 0);
    const totalProfit   = totalAmount - totalCost;

    // ── 4. Save ───────────────────────────────────────────
    const sale = await Sale.create({
      items: enrichedItems,
      totalAmount,
      totalCost,
      totalDiscount,
      totalProfit,
      paymentMethod: paymentMethod ?? 'cash',
      customerName,
      customerPhone,
      notes,
    });

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE sale (restore stock) ───────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Restore inventory quantities
    for (const item of sale.items) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: item.quantity },
      });
    }

    await sale.deleteOne();
    res.json({ message: 'Sale deleted and stock restored' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
