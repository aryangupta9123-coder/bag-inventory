import express from 'express';
import Sale from '../models/Sale.js';
import Inventory from '../models/Inventory.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── helper: build a createdAt date filter from query params ──
function dateFilter({ startDate, endDate }) {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
}

// ── GET /overview ─────────────────────────────────────────
// Returns: totalSales, totalRevenue, totalCost, totalProfit,
//          totalDiscount, totalItemsSold, averageOrderValue,
//          stockValue (at cost), stockValueAtMRP, inventoryCount
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const df = dateFilter(req.query);

    const [salesAgg, inventoryAgg] = await Promise.all([
      // ── Sales aggregation ──────────────────────────────
      Sale.aggregate([
        { $match: df },
        {
          $group: {
            _id: null,
            totalSales:     { $sum: 1 },
            totalRevenue:   { $sum: '$totalAmount' },
            totalCost:      { $sum: '$totalCost' },
            totalProfit:    { $sum: '$totalProfit' },
            totalDiscount:  { $sum: '$totalDiscount' },
            totalItemsSold: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.quantity'] },
                },
              },
            },
          },
        },
      ]),

      // ── Inventory aggregation ──────────────────────────
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            inventoryCount:   { $sum: 1 },
            totalUnits:       { $sum: '$quantity' },
            // stock value at cost price
            stockValue:       { $sum: { $multiply: ['$costPrice', '$quantity'] } },
            // stock value at selling price (MRP)
            stockValueAtMRP:  { $sum: { $multiply: ['$price', '$quantity'] } },
          },
        },
      ]),
    ]);

    const s  = salesAgg[0]  ?? {};
    const iv = inventoryAgg[0] ?? {};

    const totalRevenue = s.totalRevenue   ?? 0;
    const totalSales   = s.totalSales     ?? 0;

    res.json({
      // sales
      totalSales,
      totalRevenue,
      totalCost:          s.totalCost      ?? 0,
      totalProfit:        s.totalProfit    ?? 0,
      totalDiscount:      s.totalDiscount  ?? 0,
      totalItemsSold:     s.totalItemsSold ?? 0,
      averageOrderValue:  totalSales > 0 ? totalRevenue / totalSales : 0,
      profitMarginPct:    totalRevenue > 0
        ? +((( (s.totalProfit ?? 0) / totalRevenue) * 100).toFixed(2))
        : 0,
      // inventory
      inventoryCount:     iv.inventoryCount  ?? 0,
      totalUnits:         iv.totalUnits      ?? 0,
      stockValue:         iv.stockValue      ?? 0,   // at cost
      stockValueAtMRP:    iv.stockValueAtMRP ?? 0,   // at selling price
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /sales-by-date ────────────────────────────────────
// Returns daily/monthly array with revenue, cost, profit, count
router.get('/sales-by-date', authMiddleware, async (req, res) => {
  try {
    const { groupBy = 'day' } = req.query;
    const df = dateFilter(req.query);

    const fmt = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const data = await Sale.aggregate([
      { $match: df },
      {
        $group: {
          _id:      { $dateToString: { format: fmt, date: '$createdAt' } },
          revenue:  { $sum: '$totalAmount' },
          cost:     { $sum: '$totalCost' },
          profit:   { $sum: '$totalProfit' },
          discount: { $sum: '$totalDiscount' },
          count:    { $sum: 1 },
          unitsSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /top-products ─────────────────────────────────────
// Returns top-selling products ranked by units sold
router.get('/top-products', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const df = dateFilter(req.query);

    const data = await Sale.aggregate([
      { $match: df },
      { $unwind: '$items' },
      {
        $group: {
          _id:          '$items.inventoryId',
          name:         { $first: '$items.name' },
          sku:          { $first: '$items.sku' },
          category:     { $first: '$items.category' },
          totalSold:    { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalCost:    { $sum: { $multiply: ['$items.costPrice', '$items.quantity'] } },
          totalProfit:  { $sum: '$items.profit' },
        },
      },
      {
        $addFields: {
          marginPct: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$totalProfit', '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /by-category ──────────────────────────────────────
// Two sub-queries merged:
//   - sales data (revenue/profit) from Sale collection
//   - current stock (quantity) from Inventory collection
router.get('/by-category', authMiddleware, async (req, res) => {
  try {
    const df = dateFilter(req.query);

    const [salesByCat, stockByCat] = await Promise.all([
      // sales grouped by category (stored on each sale item)
      Sale.aggregate([
        { $match: df },
        { $unwind: '$items' },
        {
          $group: {
            _id:          '$items.category',
            totalRevenue: { $sum: '$items.subtotal' },
            totalProfit:  { $sum: '$items.profit' },
            totalQuantity:{ $sum: '$items.quantity' },
          },
        },
      ]),

      // current stock grouped by category
      Inventory.aggregate([
        {
          $group: {
            _id:           '$category',
            totalQuantity: { $sum: '$quantity' },
            totalProducts: { $sum: 1 },
            stockValue:    { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          },
        },
      ]),
    ]);

    // merge by category name
    const stockMap = Object.fromEntries(stockByCat.map((s) => [s._id, s]));

    // categories that appear in inventory but may not have sales
    const allCats = new Set([
      ...salesByCat.map((s) => s._id),
      ...stockByCat.map((s) => s._id),
    ]);

    const merged = [...allCats].map((cat) => {
      const sale  = salesByCat.find((s) => s._id === cat) ?? {};
      const stock = stockMap[cat] ?? {};
      return {
        _id:           cat,
        totalRevenue:  sale.totalRevenue  ?? 0,
        totalProfit:   sale.totalProfit   ?? 0,
        unitsSold:     sale.totalQuantity ?? 0,
        totalQuantity: stock.totalQuantity ?? 0,   // current stock
        totalProducts: stock.totalProducts ?? 0,
        stockValue:    stock.stockValue    ?? 0,
      };
    });

    // sort by current stock desc (inventory page) — caller can re-sort
    merged.sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /low-stock ────────────────────────────────────────
// Items where quantity <= their own reorderPoint
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    // use item's own reorderPoint; fallback threshold from query
    const { threshold } = req.query;

    const query = threshold
      ? { quantity: { $lte: parseInt(threshold) } }
      : { $expr: { $lte: ['$quantity', '$reorderPoint'] } };

    const items = await Inventory.find(query)
      .sort({ quantity: 1 })
      .select('name brand category quantity reorderPoint costPrice price sku');

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /profit-summary ───────────────────────────────────
// Detailed profit breakdown by payment method
router.get('/profit-summary', authMiddleware, async (req, res) => {
  try {
    const df = dateFilter(req.query);

    const data = await Sale.aggregate([
      { $match: df },
      {
        $group: {
          _id:           '$paymentMethod',
          totalRevenue:  { $sum: '$totalAmount' },
          totalCost:     { $sum: '$totalCost' },
          totalProfit:   { $sum: '$totalProfit' },
          totalDiscount: { $sum: '$totalDiscount' },
          count:         { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
