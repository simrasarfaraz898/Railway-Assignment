import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const StatCard = ({ label, value, color, sub }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: color || 'var(--text)' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
  </div>
);

const priorityColors = { low: '#94a3b8', medium: '#fbbf24', high: '#fb923c', urgent: '#f87171' };
const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(res => setStats(res.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </div>
        <div style={{ color: 'var(--text-2)', marginTop: 4 }}>
          Here's what's happening with your tasks today.
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stat" style={{ marginBottom: 32 }}>
        <StatCard label="Total Projects" value={stats?.totalProjects || 0} color="var(--accent)" sub="Active workspaces" />
        <StatCard label="My Tasks" value={stats?.myTasks?.total || 0} sub="Assigned to you" />
        <StatCard label="In Progress" value={stats?.myTasks?.['in-progress'] || 0} color="var(--accent-2)" sub="Currently active" />
        <StatCard label="Overdue" value={stats?.overdueCount || 0} color={stats?.overdueCount > 0 ? 'var(--red)' : 'var(--green)'} sub="Need attention" />
        <StatCard label="Completed" value={stats?.myTasks?.done || 0} color="var(--green)" sub="Tasks done" />
      </div>

      {/* My Task Progress */}
      {stats?.myTasks?.total > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>My Task Progress</div>
          <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
            {['todo','in-progress','review','done'].map(s => {
              const pct = stats.myTasks.total ? (stats.myTasks[s] / stats.myTasks.total) * 100 : 0;
              const colors = { todo: '#475569', 'in-progress': '#3b82f6', review: '#8b5cf6', done: '#10b981' };
              return pct > 0 ? <div key={s} style={{ width: `${pct}%`, background: colors[s], borderRadius: 99 }} /> : null;
            })}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['todo','in-progress','review','done'].map(s => {
              const colors = { todo: '#475569', 'in-progress': '#3b82f6', review: '#8b5cf6', done: '#10b981' };
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[s] }} />
                  <span style={{ color: 'var(--text-2)' }}>{statusLabels[s]}</span>
                  <span style={{ fontWeight: 600 }}>{stats.myTasks[s] || 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {stats?.recentTasks?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Tasks</div>
            <Link to="/my-tasks" style={{ fontSize: 12, color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div>
            {stats.recentTasks.map(task => (
              <div key={task._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--border)', gap: 12
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: priorityColors[task.priority] || '#94a3b8'
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {task.project?.name} · {statusLabels[task.status]}
                  </div>
                </div>
                {task.dueDate && (
                  <div style={{ fontSize: 11, color: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text-3)', flexShrink: 0 }}>
                    {format(new Date(task.dueDate), 'MMM d')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.myTasks?.total === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No tasks yet</div>
          <div style={{ color: 'var(--text-2)', marginBottom: 24 }}>Join a project or create one to get started</div>
          <Link to="/projects" className="btn btn-primary">View Projects</Link>
        </div>
      )}
    </div>
  );
}
