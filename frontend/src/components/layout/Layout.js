import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/projects', icon: '◫', label: 'Projects' },
  { path: '/my-tasks', icon: '✓', label: 'My Tasks' },
];

export default function Layout() {
  const { user, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logoutUser(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarColors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899'];
  const color = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, display: 'none' }}
          className="mobile-overlay" />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--accent)' }}>Task</span>Flow
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Team Task Manager</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>Menu</div>
          {NAV.map(({ path, icon, label }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, marginBottom: 4, fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              color: isActive ? '#fff' : 'var(--text-2)',
              background: isActive ? 'var(--accent)' : 'transparent',
            })}>
              <span style={{ fontSize: 15 }}>{icon}</span> {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 8px 8px' }}>Admin</div>
              <NavLink to="/admin" style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                color: isActive ? '#fff' : 'var(--text-2)',
                background: isActive ? 'var(--purple)' : 'transparent',
              })}>
                <span style={{ fontSize: 15 }}>⚙</span> Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="avatar" style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }} className="truncate">{user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} style={{
            marginTop: 12, width: '100%', background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-2)', borderRadius: 8, padding: '7px', fontSize: 12, transition: 'all 0.2s'
          }} onMouseOver={e => e.target.style.borderColor = 'var(--red)'}
            onMouseOut={e => e.target.style.borderColor = 'var(--border)'}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
