import { useEffect, useState, useMemo } from 'react';
import { salesAPI, inventoryAPI } from '../utils/api';
import {
  Plus, Trash2, ShoppingCart, Search, X,
  Receipt, User, CreditCard, Smartphone,
  FileText, Calendar, Package, ChevronDown, ChevronUp,
  TrendingUp, IndianRupee, Tag,
} from 'lucide-react';

/* ── theme ── */
const T = {
  bg:      '#f5f0e8',
  card:    '#faf7f2',
  border:  '#e8dfd0',
  text:    '#2c1a0e',
  muted:   '#8a6a50',
  gold:    '#b8860b',
  goldLt:  '#e8c98a',
  green:   '#4a7c59',
  greenBg: '#eaf3ec',
  red:     '#b85c38',
  redBg:   '#fdf0eb',
  brown:   '#3a1f0d',
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const PAYMENT_OPTS = [
  { value: 'cash',  label: 'Cash',  icon: Receipt },
  { value: 'card',  label: 'Card',  icon: CreditCard },
  { value: 'upi',   label: 'UPI',   icon: Smartphone },
  { value: 'other', label: 'Other', icon: FileText },
];

const paymentStyle = (method) => ({
  cash:  { bg: T.greenBg, color: T.green },
  card:  { bg: '#eef2ff', color: '#4338ca' },
  upi:   { bg: '#fdf4ff', color: '#7c3aed' },
  other: { bg: T.border,  color: T.muted  },
}[method] || { bg: T.border, color: T.muted });

/* ── shared inline input style ── */
const inp = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  borderRadius: 8, border: `1px solid ${T.border}`,
  background: '#fff', color: T.text, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: T.muted, marginBottom: 5,
};

/* ── SaleRow — collapsible bill card ── */
const SaleRow = ({ sale, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ps = paymentStyle(sale.paymentMethod);

  return (
    <div style={{ borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      {/* header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text }}>
              {sale.customerName || 'Walk-in Customer'}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: ps.bg, color: ps.color, textTransform: 'capitalize',
            }}>
              {sale.paymentMethod}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>
            {fmtDate(sale.createdAt)} · {sale.items?.length ?? 0} item{sale.items?.length !== 1 ? 's' : ''}
            {sale.customerPhone && ` · ${sale.customerPhone}`}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: T.gold }}>{fmt(sale.totalAmount)}</p>
          {sale.totalProfit !== undefined && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: T.green }}>
              +{fmt(sale.totalProfit)} profit
            </p>
          )}
        </div>
        {open ? <ChevronUp size={16} style={{ color: T.muted, flexShrink: 0 }} />
               : <ChevronDown size={16} style={{ color: T.muted, flexShrink: 0 }} />}
      </div>

      {/* expanded detail */}
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Item', 'Qty', 'Cost', 'Selling', 'Discount', 'Subtotal', 'Profit'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.muted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: T.text }}>{item.name}</td>
                  <td style={{ padding: '8px', color: T.muted }}>{item.quantity}</td>
                  <td style={{ padding: '8px', color: T.muted }}>{fmt(item.costPrice)}</td>
                  <td style={{ padding: '8px', color: T.text }}>{fmt(item.sellingPrice)}</td>
                  <td style={{ padding: '8px', color: T.red }}>{item.discount ? fmt(item.discount) : '—'}</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: T.gold }}>{fmt(item.subtotal)}</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: T.green }}>{fmt(item.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* totals row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24,
            paddingTop: 12, marginTop: 4, borderTop: `1px solid ${T.border}`, fontSize: 13 }}>
            {sale.totalDiscount > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: T.muted, fontSize: 10 }}>DISCOUNT</p>
                <p style={{ margin: 0, fontWeight: 700, color: T.red }}>{fmt(sale.totalDiscount)}</p>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: T.muted, fontSize: 10 }}>TOTAL</p>
              <p style={{ margin: 0, fontWeight: 700, color: T.gold, fontSize: 16 }}>{fmt(sale.totalAmount)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: T.muted, fontSize: 10 }}>PROFIT</p>
              <p style={{ margin: 0, fontWeight: 700, color: T.green, fontSize: 16 }}>{fmt(sale.totalProfit)}</p>
            </div>
          </div>

          {sale.notes && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
              Note: {sale.notes}
            </p>
          )}

          <button
            onClick={() => onDelete(sale._id)}
            style={{
              marginTop: 14, display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: T.redBg, color: T.red,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Delete & Restore Stock
          </button>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════ */
export const Sales = () => {
  const [sales, setSales]           = useState([]);
  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [modalError, setModalError] = useState('');

  /* cart items: { inventoryId, name, sku, category, sellingPrice, costPrice,
                   quantity, discount, maxQty } */
  const [cart, setCart]             = useState([]);
  const [invSearch, setInvSearch]   = useState('');
  const [customer, setCustomer]     = useState({ name: '', phone: '', notes: '' });
  const [payment, setPayment]       = useState('cash');

  /* bills list filter */
  const [billSearch, setBillSearch] = useState('');
  const [billPayFilter, setBillPay] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, iRes] = await Promise.all([
        salesAPI.getAll({ limit: 100 }),
        inventoryAPI.getAll(),
      ]);
      setSales(sRes.data);
      setInventory(iRes.data.filter(i => i.quantity > 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ── cart helpers ── */
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.inventoryId === item._id);
      if (ex) {
        if (ex.quantity >= ex.maxQty) return prev;
        return prev.map(c => c.inventoryId === item._id
          ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        inventoryId:  item._id,
        name:         item.name,
        sku:          item.sku || '',
        category:     item.category,
        sellingPrice: item.price,
        costPrice:    item.costPrice,
        quantity:     1,
        discount:     0,
        maxQty:       item.quantity,
      }];
    });
  };

  const updateCart = (id, field, val) => {
    setCart(prev => prev.map(c => {
      if (c.inventoryId !== id) return c;
      let v = Number(val);
      if (field === 'quantity') v = Math.min(Math.max(1, v), c.maxQty);
      if (field === 'discount') v = Math.max(0, v);
      if (field === 'sellingPrice') v = Math.max(0, v);
      return { ...c, [field]: v };
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.inventoryId !== id));

  /* ── cart totals ── */
  const cartSummary = useMemo(() => {
    let totalAmount = 0, totalCost = 0, totalDiscount = 0;
    cart.forEach(c => {
      const subtotal = (c.sellingPrice - c.discount) * c.quantity;
      const cost     = c.costPrice * c.quantity;
      totalAmount   += subtotal;
      totalCost     += cost;
      totalDiscount += c.discount * c.quantity;
    });
    return { totalAmount, totalCost, totalDiscount, totalProfit: totalAmount - totalCost };
  }, [cart]);

  /* ── submit sale ── */
  const handleSale = async () => {
    if (cart.length === 0) { setModalError('Add at least one item to the cart.'); return; }
    setModalError('');
    setSaving(true);
    try {
      await salesAPI.create({
        items: cart.map(c => ({
          inventoryId:  c.inventoryId,
          sellingPrice: c.sellingPrice,
          quantity:     c.quantity,
          discount:     c.discount,
        })),
        paymentMethod: payment,
        customerName:  customer.name,
        customerPhone: customer.phone,
        notes:         customer.notes,
      });
      setCart([]);
      setCustomer({ name: '', phone: '', notes: '' });
      setPayment('cash');
      setShowModal(false);
      fetchData();
    } catch (e) {
      setModalError(e.response?.data?.message || 'Failed to record sale.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale? Stock will be restored.')) return;
    try { await salesAPI.delete(id); fetchData(); }
    catch (e) { console.error(e); }
  };

  const openModal = () => {
    setCart([]); setCustomer({ name: '', phone: '', notes: '' });
    setPayment('cash'); setInvSearch(''); setModalError('');
    setShowModal(true);
  };

  /* ── filtered inventory for product picker ── */
  const filteredInv = useMemo(() =>
    inventory.filter(i =>
      !invSearch ||
      i.name.toLowerCase().includes(invSearch.toLowerCase()) ||
      i.brand.toLowerCase().includes(invSearch.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(invSearch.toLowerCase())
    ), [inventory, invSearch]);

  /* ── filtered bills ── */
  const filteredSales = useMemo(() =>
    sales.filter(s => {
      const matchPay = !billPayFilter || s.paymentMethod === billPayFilter;
      const matchQ   = !billSearch   ||
        (s.customerName || '').toLowerCase().includes(billSearch.toLowerCase()) ||
        (s.customerPhone || '').includes(billSearch);
      return matchPay && matchQ;
    }), [sales, billSearch, billPayFilter]);

  /* ── summary bar ── */
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === todayStr);
  const todayRevenue = todaySales.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const todayProfit  = todaySales.reduce((s, b) => s + (b.totalProfit  || 0), 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${T.gold}`, borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text }}>Billing</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{sales.length} transactions recorded</p>
        </div>
        <button onClick={openModal} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10, border: 'none',
          background: T.gold, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={15} /> New Sale
        </button>
      </div>

      {/* ── Today's summary bar ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: "Today's Bills", value: todaySales.length, icon: Receipt, color: T.gold },
          { label: "Today's Revenue", value: fmt(todayRevenue), icon: IndianRupee, color: T.text },
          { label: "Today's Profit",  value: fmt(todayProfit),  icon: TrendingUp, color: T.green },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 14,
            background: T.card, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.muted,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bill list filters ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '14px 18px',
        borderRadius: 14, background: T.card, border: `1px solid ${T.border}` }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: T.muted }} />
          <input style={{ ...inp, paddingLeft: 30 }} placeholder="Search by customer name or phone…"
            value={billSearch} onChange={e => setBillSearch(e.target.value)} />
        </div>
        <select style={{ ...inp, width: 160, cursor: 'pointer' }}
          value={billPayFilter} onChange={e => setBillPay(e.target.value)}>
          <option value="">All Payment</option>
          {PAYMENT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Bills list ── */}
      {filteredSales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 14,
          background: T.card, border: `1px solid ${T.border}` }}>
          <Receipt size={40} style={{ color: T.muted, opacity: 0.35, marginBottom: 12 }} />
          <p style={{ margin: 0, color: T.muted }}>No bills found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredSales.map(s => (
            <SaleRow key={s._id} sale={s} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          NEW SALE MODAL
      ════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 900, maxHeight: '94vh', overflowY: 'auto',
            background: T.card, borderRadius: 18, padding: '24px 24px 20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

            {/* modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: T.brown,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={16} color="#e8c98a" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>New Sale</h2>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: T.redBg, color: T.red, fontSize: 13 }}>{modalError}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* ── LEFT: Product picker ── */}
              <div>
                <p style={{ ...lbl, marginBottom: 8 }}>Select Products</p>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%',
                    transform: 'translateY(-50%)', color: T.muted }} />
                  <input style={{ ...inp, paddingLeft: 28 }} placeholder="Search products…"
                    value={invSearch} onChange={e => setInvSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredInv.length === 0 && (
                    <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                      No products in stock
                    </p>
                  )}
                  {filteredInv.map(item => {
                    const inCart = cart.find(c => c.inventoryId === item._id);
                    return (
                      <div key={item._id} style={{ display: 'flex', alignItems: 'center',
                        gap: 10, padding: '10px 12px', borderRadius: 10,
                        border: `1px solid ${inCart ? T.goldLt : T.border}`,
                        background: inCart ? '#fff8ed' : '#fff', cursor: 'pointer' }}
                        onClick={() => addToCart(item)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{item.name}</p>
                          <p style={{ margin: '1px 0 0', fontSize: 11, color: T.muted }}>
                            {item.brand} · {fmt(item.price)} · <span style={{ color: item.quantity <= 5 ? T.red : T.green }}>
                              {item.quantity} left</span>
                          </p>
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 8,
                          background: inCart ? T.goldLt : T.border,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Plus size={13} style={{ color: inCart ? T.brown : T.muted }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── RIGHT: Cart + customer + payment ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Cart items */}
                <div>
                  <p style={{ ...lbl, marginBottom: 8 }}>Cart</p>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', borderRadius: 10,
                      background: T.bg, border: `1px dashed ${T.border}` }}>
                      <ShoppingCart size={28} style={{ color: T.muted, opacity: 0.3, marginBottom: 6 }} />
                      <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Click products to add</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                      maxHeight: 220, overflowY: 'auto' }}>
                      {cart.map(c => (
                        <div key={c.inventoryId} style={{ padding: '10px 12px', borderRadius: 10,
                          border: `1px solid ${T.border}`, background: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 8 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{c.name}</p>
                            <button onClick={() => removeFromCart(c.inventoryId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer',
                                color: T.red, padding: 2 }}>
                              <X size={14} />
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            {/* qty */}
                            <div>
                              <p style={{ ...lbl, fontSize: 9 }}>Qty (max {c.maxQty})</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => updateCart(c.inventoryId, 'quantity', c.quantity - 1)}
                                  style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border}`,
                                    background: T.bg, cursor: 'pointer', fontWeight: 700, color: T.text, fontSize: 14 }}>−</button>
                                <input type="number" value={c.quantity} min={1} max={c.maxQty}
                                  onChange={e => updateCart(c.inventoryId, 'quantity', e.target.value)}
                                  style={{ ...inp, width: 44, textAlign: 'center', padding: '4px 6px' }} />
                                <button onClick={() => updateCart(c.inventoryId, 'quantity', c.quantity + 1)}
                                  style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border}`,
                                    background: T.bg, cursor: 'pointer', fontWeight: 700, color: T.text, fontSize: 14 }}>+</button>
                              </div>
                            </div>
                            {/* selling price */}
                            <div>
                              <p style={{ ...lbl, fontSize: 9 }}>Price (₹)</p>
                              <input type="number" value={c.sellingPrice} min={0}
                                onChange={e => updateCart(c.inventoryId, 'sellingPrice', e.target.value)}
                                style={{ ...inp, padding: '5px 8px' }} />
                            </div>
                            {/* discount */}
                            <div>
                              <p style={{ ...lbl, fontSize: 9 }}>Discount (₹)</p>
                              <input type="number" value={c.discount} min={0}
                                onChange={e => updateCart(c.inventoryId, 'discount', e.target.value)}
                                style={{ ...inp, padding: '5px 8px' }} />
                            </div>
                          </div>
                          {/* line subtotal */}
                          <p style={{ margin: '6px 0 0', fontSize: 11, color: T.muted, textAlign: 'right' }}>
                            Subtotal: <strong style={{ color: T.gold }}>
                              {fmt((c.sellingPrice - c.discount) * c.quantity)}
                            </strong>
                            &nbsp;· Profit: <strong style={{ color: T.green }}>
                              {fmt((c.sellingPrice - c.discount - c.costPrice) * c.quantity)}
                            </strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bill summary */}
                {cart.length > 0 && (
                  <div style={{ padding: '12px 14px', borderRadius: 10,
                    background: T.bg, border: `1px solid ${T.border}` }}>
                    {[
                      { label: 'Subtotal', value: fmt(cartSummary.totalAmount + cartSummary.totalDiscount), color: T.text },
                      { label: 'Discount', value: `−${fmt(cartSummary.totalDiscount)}`, color: T.red },
                      { label: 'Total',    value: fmt(cartSummary.totalAmount),  color: T.gold, bold: true },
                      { label: 'Profit',   value: fmt(cartSummary.totalProfit),  color: T.green, bold: true },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4, fontSize: r.bold ? 14 : 12 }}>
                        <span style={{ color: T.muted }}>{r.label}</span>
                        <span style={{ fontWeight: r.bold ? 700 : 500, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment method */}
                <div>
                  <p style={lbl}>Payment Method</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PAYMENT_OPTS.map(o => {
                      const Icon = o.icon;
                      const active = payment === o.value;
                      return (
                        <button key={o.value} onClick={() => setPayment(o.value)}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${active ? T.gold : T.border}`,
                            background: active ? '#fff8ed' : '#fff',
                            color: active ? T.gold : T.muted,
                            fontSize: 11, fontWeight: 600,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <Icon size={14} />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Customer Name</label>
                    <input style={inp} placeholder="Optional"
                      value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Phone</label>
                    <input style={inp} placeholder="Optional"
                      value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Notes</label>
                    <textarea style={{ ...inp, resize: 'vertical', minHeight: 52 }} rows={2}
                      placeholder="Optional notes…"
                      value={customer.notes} onChange={e => setCustomer(c => ({ ...c, notes: e.target.value }))} />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSale} disabled={saving || cart.length === 0}
                    style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                      background: cart.length === 0 ? T.border : T.gold,
                      color: cart.length === 0 ? T.muted : '#fff',
                      fontSize: 14, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Recording…' : `Complete Sale · ${fmt(cartSummary.totalAmount)}`}
                  </button>
                  <button onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 10,
                      border: `1px solid ${T.border}`, background: 'transparent',
                      color: T.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
