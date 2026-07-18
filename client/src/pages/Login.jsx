import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  bg:     '#f5f0e8',
  card:   '#faf7f2',
  border: '#e8dfd0',
  text:   '#2c1a0e',
  muted:  '#8a6a50',
  gold:   '#b8860b',
  green:  '#4a7c59',
  red:    '#b85c38',
  redBg:  '#fdf0eb',
};

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    borderRadius: 10, border: `1px solid ${T.border}`,
    background: '#fff', color: T.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, #1c120a 0%, #2c1a0e 50%, #1c120a 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* background shimmer dots */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 300 + i * 80, height: 300 + i * 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)',
            top: `${10 + i * 15}%`, left: `${5 + i * 14}%`,
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* ── Logo block ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 110, height: 110, borderRadius: 24, overflow: 'hidden',
            background: '#000',
            boxShadow: '0 0 40px rgba(184,134,11,0.4), 0 8px 32px rgba(0,0,0,0.6)',
            marginBottom: 16, flexShrink: 0,
          }}>
            <img
              src="/logo.png"
              alt="AnandX Bags"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                if (!e.target.src.includes('logo.svg')) e.target.src = '/logo.svg';
              }}
            />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#e8c98a',
            letterSpacing: '0.06em', textAlign: 'center' }}>
            AnandX Bags
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 11, fontWeight: 700, color: '#6b4c30',
            letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Store Ledger
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: T.card, borderRadius: 20,
          padding: '32px 32px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          border: `1px solid rgba(232,201,138,0.15)`,
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: T.text, textAlign: 'center' }}>
            Welcome back
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: T.muted, textAlign: 'center' }}>
            Sign in to your store account
          </p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 18,
              background: T.redBg, color: T.red, fontSize: 13,
              border: `1px solid rgba(184,92,56,0.2)`,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
                color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Username
              </label>
              <input
                style={inp}
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                required
                onChange={e => setUsername(e.target.value)}
                onFocus={e => (e.target.style.borderColor = T.gold)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
                color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  style={inp}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  required
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = T.gold)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: T.muted, padding: 0, fontSize: 12 }}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 6,
                borderRadius: 10, border: 'none',
                background: loading ? T.border : T.gold,
                color: loading ? T.muted : '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: 13, color: T.muted }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: T.gold, fontWeight: 700, textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#6b4c30' }}>
          Secured with JWT authentication
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
