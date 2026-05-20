import React, { useEffect, useState } from 'react';
import { getUsers, updateUserRole } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    getUsers().then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  const adminCount = users.filter(u => u.role === 'admin').length;
  const memberCount = users.filter(u => u.role === 'member').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Admin Panel</div>
          <div className="page-subtitle">Manage users and roles</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stat" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--accent)' },
          { label: 'Admins', value: adminCount, color: 'var(--purple)' },
          { label: 'Members', value: memberCount, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          All Users
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
              {['User','Email','Role','Joined','Actions'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b'];
              const bg = colors[(u.name?.charCodeAt(0) || 0) % colors.length];
              const initials = u.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';
              return (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: bg, color: '#fff', fontSize: 11 }}>{initials}</div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {u.name} {u._id === currentUser?._id && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>(you)</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-3)' }}>
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {u._id !== currentUser?._id ? (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="member">Set Member</option>
                        <option value="admin">Set Admin</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
