import { useEffect, useState, useRef } from 'react';
import { inventoryAPI, uploadAPI } from '../utils/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash2, Search, Filter, Package, X, Tag, Upload, ImageOff } from 'lucide-react';

const T = {
  bg:     '#f5f0e8',
  card:   '#faf7f2',
  border: '#e8dfd0',
  text:   '#2c1a0e',
  muted:  '#8a6a50',
  gold:   '#b8860b',
  green:  '#4a7c59',
  greenBg:'#eaf3ec',
  red:    '#b85c38',
  redBg:  '#fdf0eb',
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ── Image uploader sub-component ── */
const ImageUploader = ({ currentUrl, onUploaded, onClear }) => {
  const inputRef   = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadErr('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadErr('Image must be under 5 MB.');    return; }
    setUploadErr('');
    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      onUploaded(res.data.imageUrl);   // e.g. /uploads/product-123.jpg
    } catch (e) {
      setUploadErr(e.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const previewSrc = currentUrl ? uploadAPI.getImageUrl(currentUrl) : null;

  return (
    <div>
      {previewSrc ? (
        /* ── preview with remove button ── */
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
          border: `1px solid ${T.border}`, width: '100%', aspectRatio: '16/7' }}>
          <img src={previewSrc} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={onClear}
            style={{ position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        /* ── drop zone ── */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? T.gold : T.border}`,
            borderRadius: 10, padding: '24px 16px',
            textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? '#fff8ed' : T.bg,
            transition: 'border-color 0.15s, background 0.15s',
          }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%',
                border: `3px solid ${T.gold}`, borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Uploading…</p>
            </div>
          ) : (
            <>
              <Upload size={24} style={{ color: T.muted, opacity: 0.5, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.muted }}>
                Click or drag an image here
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted }}>
                JPEG, PNG, WebP, GIF · max 5 MB
              </p>
            </>
          )}
        </div>
      )}
      {uploadErr && (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T.red }}>{uploadErr}</p>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
};

const EMPTY_FORM = {
  name: '', brand: '', category: '', sku: '',
  price: '', costPrice: '', quantity: '',
  reorderPoint: '5',
  description: '', color: '', size: '', imageUrl: '',
};

export const Inventory = () => {
  const [items, setItems]               = useState([]);
  const [filteredItems, setFiltered]    = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [searchTerm, setSearch]         = useState('');
  const [categoryFilter, setCatFilter]  = useState('');
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    let out = items;
    if (searchTerm)
      out = out.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (categoryFilter) out = out.filter(i => i.category === categoryFilter);
    setFiltered(out);
  }, [items, searchTerm, categoryFilter]);

  const fetchItems = async () => {
    try {
      const res = await inventoryAPI.getAll();
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name:         item.name,
      brand:        item.brand,
      category:     item.category,
      sku:          item.sku          || '',
      price:        item.price        ?? '',
      costPrice:    item.costPrice    ?? '',
      quantity:     item.quantity     ?? '',
      reorderPoint: item.reorderPoint ?? '5',
      description:  item.description  || '',
      color:        item.color        || '',
      size:         item.size         || '',
      imageUrl:     item.imageUrl     || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.costPrice || Number(formData.costPrice) <= 0) {
      setError('Cost price is required and must be greater than 0.');
      return;
    }
    if (Number(formData.costPrice) > Number(formData.price)) {
      setError('Cost price cannot be greater than selling price.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price:        Number(formData.price),
        costPrice:    Number(formData.costPrice),
        quantity:     Number(formData.quantity),
        reorderPoint: Number(formData.reorderPoint || 5),
      };

      if (editingItem) {
        await inventoryAPI.update(editingItem._id, payload);
      } else {
        await inventoryAPI.create(payload);
      }

      await fetchItems();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await inventoryAPI.delete(id);
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean);

  const field = (key, e) => setFormData(f => ({ ...f, [key]: e.target.value }));

  /* ── shared input style ── */
  const inputSx = {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: '#fff',
    color: T.text,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelSx = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: T.muted,
    marginBottom: 5,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${T.gold}`,
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text }}>Inventory</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{items.length} products in stock</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: T.gold, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        padding: '16px 20px', borderRadius: 14,
        background: T.card, border: `1px solid ${T.border}`,
      }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <input
            style={{ ...inputSx, paddingLeft: 32 }}
            placeholder="Search by name, brand or SKU…"
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <select
            style={{ ...inputSx, paddingLeft: 30, paddingRight: 28, cursor: 'pointer', minWidth: 160 }}
            value={categoryFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      {filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          borderRadius: 14, background: T.card, border: `1px solid ${T.border}`,
        }}>
          <Package size={40} style={{ color: T.muted, opacity: 0.4, marginBottom: 12 }} />
          <p style={{ color: T.muted, margin: 0 }}>No items found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {filteredItems.map(item => {
            const margin = item.price > 0
              ? Math.round(((item.price - (item.costPrice || 0)) / item.price) * 100)
              : 0;
            return (
              <div key={item._id} style={{
                borderRadius: 14, overflow: 'hidden',
                background: T.card, border: `1px solid ${T.border}`,
                display: 'flex', flexDirection: 'column',
              }}>
                {/* image / placeholder */}
                {item.imageUrl ? (
                  <img
                    src={uploadAPI.getImageUrl(item.imageUrl)}
                    alt={item.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{
                  height: 160, background: '#f0ebe0',
                  alignItems: 'center', justifyContent: 'center',
                  display: item.imageUrl ? 'none' : 'flex',
                }}>
                  <Package size={36} style={{ color: T.muted, opacity: 0.4 }} />
                </div>

                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text }}>{item.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: T.muted }}>{item.brand}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: item.quantity <= (item.reorderPoint || 5) ? T.redBg : T.greenBg,
                      color: item.quantity <= (item.reorderPoint || 5) ? T.red : T.green,
                      flexShrink: 0, marginLeft: 8,
                    }}>
                      {item.quantity} units
                    </span>
                  </div>

                  <span style={{
                    alignSelf: 'flex-start', fontSize: 10, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 20,
                    background: '#f0ebe0', color: T.muted,
                  }}>
                    {item.category}
                  </span>

                  {/* pricing row */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginTop: 4 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: T.muted }}>Selling</p>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: T.gold }}>{fmt(item.price)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: T.muted }}>Cost</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{fmt(item.costPrice)}</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <p style={{ margin: 0, fontSize: 10, color: T.muted }}>Margin</p>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.green }}>{margin}%</p>
                    </div>
                  </div>

                  {item.sku && (
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                      <Tag size={10} style={{ marginRight: 3 }} />SKU: {item.sku}
                    </p>
                  )}
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
                  <button
                    onClick={() => openEdit(item)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '7px', borderRadius: 8, border: `1px solid ${T.border}`,
                      background: 'transparent', color: T.muted,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '7px', borderRadius: 8, border: 'none',
                      background: T.redBg, color: T.red,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            width: '100%', maxWidth: 580,
            maxHeight: '92vh', overflowY: 'auto',
            background: T.card, borderRadius: 18,
            padding: '28px 28px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            {/* modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: T.redBg, color: T.red, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSx}>Name *</label>
                  <input style={inputSx} required placeholder="e.g. Classic Tote Bag"
                    value={formData.name} onChange={e => field('name', e)} />
                </div>

                {/* Brand */}
                <div>
                  <label style={labelSx}>Brand *</label>
                  <input style={inputSx} required placeholder="Brand name"
                    value={formData.brand} onChange={e => field('brand', e)} />
                </div>

                {/* Category */}
                <div>
                  <label style={labelSx}>Category *</label>
                  <input style={inputSx} required placeholder="e.g. Handbag, Backpack"
                    value={formData.category} onChange={e => field('category', e)} />
                </div>

                {/* SKU */}
                <div>
                  <label style={labelSx}>SKU</label>
                  <input style={inputSx} placeholder="e.g. BAG-001"
                    value={formData.sku} onChange={e => field('sku', e)} />
                </div>

                {/* Selling Price */}
                <div>
                  <label style={labelSx}>Selling Price (₹) *</label>
                  <input style={inputSx} type="number" required min="0" placeholder="0"
                    value={formData.price} onChange={e => field('price', e)} />
                </div>

                {/* Cost Price — highlighted */}
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '12px 14px', borderRadius: 10,
                  background: '#fff8ed', border: `1px solid #e8c98a`,
                }}>
                  <label style={{ ...labelSx, color: T.gold }}>Cost Price (₹) * — what you paid per unit</label>
                  <input style={{ ...inputSx, borderColor: '#e8c98a' }}
                    type="number" required min="0" placeholder="0"
                    value={formData.costPrice} onChange={e => field('costPrice', e)} />
                  {formData.costPrice && formData.price && Number(formData.price) > 0 && (
                    <p style={{ margin: '5px 0 0', fontSize: 11, color: T.green }}>
                      Margin: {Math.round(((Number(formData.price) - Number(formData.costPrice)) / Number(formData.price)) * 100)}%
                      &nbsp;·&nbsp; Profit per unit: {fmt(Number(formData.price) - Number(formData.costPrice))}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label style={labelSx}>Quantity *</label>
                  <input style={inputSx} type="number" required min="0" placeholder="0"
                    value={formData.quantity} onChange={e => field('quantity', e)} />
                </div>

                {/* Reorder Point */}
                <div>
                  <label style={labelSx}>Reorder Alert At</label>
                  <input style={inputSx} type="number" min="0" placeholder="5"
                    value={formData.reorderPoint} onChange={e => field('reorderPoint', e)} />
                </div>

                {/* Color */}
                <div>
                  <label style={labelSx}>Color</label>
                  <input style={inputSx} placeholder="e.g. Black, Brown"
                    value={formData.color} onChange={e => field('color', e)} />
                </div>

                {/* Size */}
                <div>
                  <label style={labelSx}>Size</label>
                  <input style={inputSx} placeholder="e.g. Small, Medium"
                    value={formData.size} onChange={e => field('size', e)} />
                </div>

                {/* Image Upload */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSx}>Product Image</label>
                  <ImageUploader
                    currentUrl={formData.imageUrl}
                    onUploaded={(url) => setFormData(f => ({ ...f, imageUrl: url }))}
                    onClear={() => setFormData(f => ({ ...f, imageUrl: '' }))}
                  />
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSx}>Description</label>
                  <textarea
                    style={{ ...inputSx, resize: 'vertical', minHeight: 72 }}
                    rows={3} placeholder="Product description…"
                    value={formData.description}
                    onChange={e => field('description', e)}
                  />
                </div>
              </div>

              {/* buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: T.gold, color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    background: 'transparent', color: T.muted,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
