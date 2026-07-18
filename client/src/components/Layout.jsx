import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  Receipt,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const S = {
  sideBg:      '#1c120a',
  brandBorder: 'rgba(255,255,255,0.08)',
  groupLabel:  '#5a3c22',
  itemDefault: '#c8a070',
  itemActive:  '#e8c98a',
  activeBg:    '#3a1f0d',
  hoverBg:     'rgba(255,255,255,0.06)',
  divider:     'rgba(255,255,255,0.08)',
  userSub:     '#5a3c22',
  logoutColor: '#b87060',
  logoutHover: 'rgba(184,112,96,0.12)',
};

const SIDEBAR_W = 240;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return desktop;
}

const NavLink = ({ item, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isActive(item.path);
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
        background: active ? S.activeBg : hovered ? S.hoverBg : 'transparent',
        color: active || hovered ? S.itemActive : S.itemDefault,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <Icon size={15} style={{ flexShrink: 0 }} />
      <span>{item.label}</span>
    </Link>
  );
};

const LogoutBtn = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: 'none',
        background: hovered ? S.logoutHover : 'transparent',
        color: S.logoutColor,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <LogOut size={15} />
      <span>Logout</span>
    </button>
  );
};

const SidebarContent = ({ user, navGroups, isActive, initials, logout, onClose }) => (
  <div style={{
    width: SIDEBAR_W,
    height: '100%',
    background: S.sideBg,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
    {/* Brand */}
    <div style={{
      padding: '20px 20px 16px',
      borderBottom: `1px solid ${S.brandBorder}`,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Logo image */}
      <div style={{
        width: 80, height: 80,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(184,134,11,0.3)',
      }}>
        <img
          src="/logo.png"
          alt="AnandX Bags"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            // fallback to SVG if PNG not found
            if (!e.target.src.includes('logo.svg')) {
              e.target.src = '/logo.svg';
            } else {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
        <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%' }}>
          <ShoppingBag size={28} color="#b8860b" />
        </div>
      </div>
      <p style={{ margin: 0, color: '#e8c98a', fontWeight: 700, fontSize: 13,
        letterSpacing: '0.04em', textAlign: 'center' }}>
        AnandX Bags
      </p>
      <p style={{ margin: '2px 0 0', color: S.groupLabel, fontSize: 9,
        fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        Store Ledger
      </p>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
      {navGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <p style={{
            margin: '0 0 6px 12px',
            color: S.groupLabel,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            {group.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.items.map((item) => (
              <NavLink key={item.path} item={item} isActive={isActive} onClick={onClose} />
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Footer */}
    <div style={{
      padding: '12px 12px 20px',
      borderTop: `1px solid ${S.divider}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 12px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: S.activeBg, color: S.itemActive,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, color: '#fff', fontSize: 13, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.username}
          </p>
          <p style={{ margin: 0, color: S.userSub, fontSize: 11 }}>Store Manager</p>
        </div>
      </div>
      <LogoutBtn onClick={logout} />
    </div>
  </div>
);

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/sales',     label: 'Billing',   icon: Receipt },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/analytics', label: 'Reports',   icon: BarChart3 },
      ],
    },
    {
      label: 'MANAGE',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';
  const shared = { user, navGroups, isActive, initials, logout };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f5f0e8',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>

      {/* Desktop sidebar */}
      {isDesktop && (
        <div style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 10,
        }}>
          <SidebarContent {...shared} onClose={() => {}} />
        </div>
      )}

      {/* Mobile hamburger */}
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen((o) => !o)}
          style={{
            position: 'fixed',
            top: 14, left: 14,
            zIndex: 60,
            width: 36, height: 36,
            borderRadius: 8,
            border: 'none',
            background: S.activeBg,
            color: S.itemActive,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 50,
          }}
        />
      )}

      {/* Mobile drawer */}
      {!isDesktop && mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 55,
          overflowY: 'auto',
        }}>
          <SidebarContent {...shared} onClose={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: '#f5f0e8',
        padding: isDesktop ? '28px 32px' : '64px 16px 16px',
      }}>
        {children}
      </div>
    </div>
  );
};
