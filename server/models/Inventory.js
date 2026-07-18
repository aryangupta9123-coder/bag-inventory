import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple docs with no sku
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Pricing ───────────────────────────────────────────
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      // selling / MRP price
      type: Number,
      required: true,
      min: 0,
    },

    // ── Stock ─────────────────────────────────────────────
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderPoint: {
      // alert fires when quantity <= reorderPoint
      type: Number,
      default: 5,
      min: 0,
    },

    // ── Details ───────────────────────────────────────────
    description: { type: String, trim: true },
    color:       { type: String, trim: true },
    size:        { type: String, trim: true },
    imageUrl:    { type: String, trim: true },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
  }
);

// ── Indexes ───────────────────────────────────────────────
inventorySchema.index({ category: 1 });
inventorySchema.index({ brand: 1 });
inventorySchema.index({ quantity: 1 });          // low-stock queries
inventorySchema.index({ name: 'text', brand: 'text' }); // full-text search

// ── Virtual: profit margin % ──────────────────────────────
inventorySchema.virtual('marginPct').get(function () {
  if (!this.price || this.price === 0) return 0;
  return (((this.price - this.costPrice) / this.price) * 100).toFixed(2);
});

// ── Virtual: stock value at cost ──────────────────────────
inventorySchema.virtual('stockValueAtCost').get(function () {
  return this.costPrice * this.quantity;
});

// ── Virtual: stock value at selling price ─────────────────
inventorySchema.virtual('stockValueAtPrice').get(function () {
  return this.price * this.quantity;
});

export default mongoose.model('Inventory', inventorySchema);
