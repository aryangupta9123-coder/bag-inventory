import mongoose from 'mongoose';

// ── Line-item sub-schema ──────────────────────────────────
const saleItemSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    name:     { type: String, required: true },
    sku:      { type: String },
    category: { type: String },

    quantity: { type: Number, required: true, min: 1 },

    // prices captured at time of sale (snapshot — never changes after)
    costPrice:    { type: Number, required: true, min: 0 },  // what we paid
    sellingPrice: { type: Number, required: true, min: 0 },  // what customer pays
    discount:     { type: Number, default: 0, min: 0 },      // ₹ discount on this line

    // computed on create, stored for fast aggregation
    subtotal: { type: Number, required: true },  // (sellingPrice - discount) * quantity
    profit:   { type: Number, required: true },  // (sellingPrice - discount - costPrice) * quantity
  },
  { _id: false }
);

// ── Main sale schema ──────────────────────────────────────
const saleSchema = new mongoose.Schema(
  {
    // ── Bill items ────────────────────────────────────────
    items: {
      type: [saleItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A sale must have at least one item',
      },
    },

    // ── Bill totals (stored for instant queries) ──────────
    totalAmount:    { type: Number, required: true, min: 0 }, // sum of subtotals
    totalCost:      { type: Number, required: true, min: 0 }, // sum of costPrice * qty
    totalDiscount:  { type: Number, default: 0, min: 0 },
    totalProfit:    { type: Number, required: true },          // totalAmount - totalCost

    // ── Payment ───────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'other'],
      default: 'cash',
    },

    // ── Customer ──────────────────────────────────────────
    customerName:  { type: String, trim: true },
    customerPhone: { type: String, trim: true },

    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────
saleSchema.index({ createdAt: -1 });          // most queries sort by date
saleSchema.index({ 'items.inventoryId': 1 }); // top-products aggregation
saleSchema.index({ paymentMethod: 1 });

// ── Virtual: profit margin % on this bill ────────────────
saleSchema.virtual('marginPct').get(function () {
  if (!this.totalAmount || this.totalAmount === 0) return 0;
  return (((this.totalProfit) / this.totalAmount) * 100).toFixed(2);
});

export default mongoose.model('Sale', saleSchema);
