import { useEffect, useState, useMemo } from 'react';
import { analyticsAPI } from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Package, ShoppingCart, IndianRupee,
  BarChart3, Calendar, X, Award, Percent, AlertTriangle,
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

/* palette for category chart */
const CAT_COLORS = ['#b8860b','#4a7c59','#b85c38','#6b4c30','#2d5a3d','#8a6a50','#9a6f1a','#5a3c22'];

const fmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtK = (v) => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v;

/* ── shared tooltip ── */
const ChartTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '10px 14px', fontSize: 12, color: T.text,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, color: T.muted }}>{prefix}{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '2px 0', color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'Orders' && p.name !== 'Units Sold'
            ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

/* ── stat card ── */
const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
  <div style={{ flex: 1, minWidth: 160, padding: '18px 20px', borderRadius: 16,
    background: T.card, border: `1px solid ${T.border}` }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.muted,
        textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
    </div>
    <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: T.text, lineHeight: 1.1 }}>{value}</p>
    {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted }}>{sub}</p>}
  </div>
);

/* ── section card wrapper ── */
const Section = ({ title, sub, children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: '22px 24px', ...style }}>
    {title && (
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h2>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>{sub}</p>}
      </div>
    )}
    {children}
  </div>
);

/* ══════════════════════════════════════════════
   Main component
══════════════════════════════════════════════ */
export const Analytics = () => {
  const [overview,        setOverview]     = useState(null);
  const [salesByDate,     setSalesByDate]  = useState([]);
  const [topProducts,     setTopProducts]  = useState([]);
  const [byCategory,      setByCategory]   = useState([]);
  const [lowStock,        setLowStock]     = useState([]);
  const [loading,         setLoading]      = useState(true);
  const [groupBy,         setGroupBy]      = useState('day');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => { fetchData(); }, [dateRange, groupBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = {};
      if (dateRange.startDate) p.startDate = dateRange.startDate;
      if (dateRange.endDate)   p.endDate   = dateRange.endDate;

      const [ovRes, dateRes, topRes, catRes, lowRes] = await Promise.all([
        analyticsAPI.getOverview(p),
        analyticsAPI.getSalesByDate({ ...p, groupBy }),
        analyticsAPI.getTopProducts({ ...p, limit: 8 }),
        analyticsAPI.getByCategory(p),
        analyticsAPI.getLowStock({}),
      ]);

      setOverview(ovRes.data);
      setSalesByDate(dateRes.data.map(d => ({
        ...d,
        label: d._id,
      })));
      setTopProducts(topRes.data);
      setByCategory(catRes.data);
      setLowStock(lowRes.data?.slice(0, 6) || []);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearDates = () => setDateRange({ startDate: '', endDate: '' });

  const ov = overview || {};
  const profitMargin = ov.totalRevenue > 0
    ? +((ov.totalProfit / ov.totalRevenue) * 100).toFixed(1) : 0;

  /* donut data for profit margin */
  const donutData = [
    { name: 'Profit', value: profitMargin },
    { name: 'Cost',   value: Math.max(0, 100 - profitMargin) },
  ];

  /* pie data — use current stock qty per category */
  const pieData = useMemo(() =>
    byCategory.filter(c => c.totalQuantity > 0).map(c => ({
      name:  c._id,
      value: c.totalQuantity,
    })), [byCategory]);

  const inp = {
    padding: '8px 12px', fontSize: 13, borderRadius: 8,
    border: `1px solid ${T.border}`, background: '#fff',
    color: T.text, outline: 'none', fontFamily: 'inherit',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${T.gold}`, borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text }}>Reports</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>Sales performance & inventory insights</p>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px',
        borderRadius: 14, background: T.card, border: `1px solid ${T.border}`,
        alignItems: 'flex-end' }}>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 600,
            color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start Date</p>
          <input type="date" style={inp} value={dateRange.startDate}
            onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))} />
        </div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 600,
            color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>End Date</p>
          <input type="date" style={inp} value={dateRange.endDate}
            onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))} />
        </div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 600,
            color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group By</p>
          <select style={{ ...inp, cursor: 'pointer', paddingRight: 28 }}
            value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        {(dateRange.startDate || dateRange.endDate) && (
          <button onClick={clearDates} style={{ display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.muted, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Stat cards row ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Total Revenue"   value={fmt(ov.totalRevenue)}   sub={`${ov.totalSales || 0} bills`}
          icon={IndianRupee} iconColor={T.gold}  iconBg="#fff3cd" />
        <StatCard label="Net Profit"      value={fmt(ov.totalProfit)}    sub={`${profitMargin}% margin`}
          icon={TrendingUp}  iconColor={T.green} iconBg={T.greenBg} />
        <StatCard label="Items Sold"      value={(ov.totalItemsSold || 0).toLocaleString('en-IN')} sub="units"
          icon={ShoppingCart} iconColor={T.brown} iconBg="#f0ebe0" />
        <StatCard label="Stock Value"     value={fmt(ov.stockValue)} sub={`${ov.totalUnits || 0} units · at cost`}
          icon={Package}     iconColor={T.red}   iconBg={T.redBg} />
        <StatCard label="Avg Order Value" value={fmt(ov.averageOrderValue)} sub="per bill"
          icon={Award}       iconColor="#7c3aed" iconBg="#f5f3ff" />
        <StatCard label="Profit Margin"   value={`${profitMargin}%`}     sub="net margin"
          icon={Percent}     iconColor={T.green} iconBg={T.greenBg} />
      </div>

      {/* ── Revenue vs Profit line chart ── */}
      <Section title="Revenue vs. Profit" sub={`${groupBy === 'day' ? 'Daily' : 'Monthly'} trend`}>
        {salesByDate.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.muted, padding: '40px 0', fontSize: 13 }}>No sales data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={salesByDate} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: T.muted }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={T.gold}
                strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: T.gold }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke={T.green}
                strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: T.green }} />
              <Line type="monotone" dataKey="cost" name="Cost" stroke={T.red}
                strokeWidth={1.5} strokeDasharray="2 4" dot={false} activeDot={{ r: 3, fill: T.red }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Top products bar + Category pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Bar chart — top products by units sold */}
        <Section title="Top Products" sub="By units sold">
          {topProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: T.muted, padding: '40px 0', fontSize: 13 }}>No sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.muted }}
                  axisLine={false} tickLine={false} width={90} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, color: T.muted }}>{label}</p>
                      <p style={{ margin: 0, color: T.gold }}>Units: {payload[0].value}</p>
                      {payload[1] && <p style={{ margin: 0, color: T.green }}>Revenue: {fmt(payload[1].value)}</p>}
                    </div>
                  );
                }} />
                <Bar dataKey="totalSold" name="Units Sold" fill={T.gold} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Pie chart — stock by category */}
        <Section title="Stock by Category" sub="Current units in store">
          {pieData.length === 0 ? (
            <p style={{ textAlign: 'center', color: T.muted, padding: '40px 0', fontSize: 13 }}>No inventory data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  dataKey="value" strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: T.muted, strokeWidth: 1 }}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} units`, 'Stock']}
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Category breakdown table ── */}
      <Section title="Category Breakdown" sub="Revenue, profit and stock per category">
        {byCategory.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.muted, padding: '24px 0', fontSize: 13 }}>No data</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Category', 'In Stock', 'Units Sold', 'Revenue', 'Profit', 'Stock Value'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Category' ? 'left' : 'right',
                      fontSize: 10, fontWeight: 700, color: T.muted,
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCategory.map((cat, i) => (
                  <tr key={cat._id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%',
                          background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: T.text }}>{cat._id}</span>
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: T.muted }}>{cat.totalQuantity}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: T.muted }}>{cat.unitsSold || 0}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: T.gold }}>{fmt(cat.totalRevenue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: T.green }}>{fmt(cat.totalProfit)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: T.text }}>{fmt(cat.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Top products table ── */}
      <Section title="Top Products Detail" sub="Full breakdown by product">
        {topProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.muted, padding: '24px 0', fontSize: 13 }}>No sales data</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'Profit', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '8px 12px',
                      textAlign: h === '#' || h === 'Product' || h === 'Category' ? 'left' : 'right',
                      fontSize: 10, fontWeight: 700, color: T.muted,
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 12px', color: T.muted, fontWeight: 700 }}>#{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.text }}>{p.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: '#f0ebe0', color: T.muted }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: T.muted }}>{p.totalSold}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: T.gold }}>{fmt(p.totalRevenue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: T.green }}>{fmt(p.totalProfit)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: p.marginPct >= 30 ? T.green : T.red }}>
                        {Number(p.marginPct || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Low stock alerts ── */}
      {lowStock.length > 0 && (
        <Section title="Low Stock Alerts" sub="Items below reorder threshold">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {lowStock.map(item => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, background: T.redBg }}>
                <AlertTriangle size={16} style={{ color: T.red, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{item.category} · {item.quantity} left</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
};
