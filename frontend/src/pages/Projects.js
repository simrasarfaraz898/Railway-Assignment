import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316'];

function ProjectModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await createProject(form);
      onSuccess(res.data.project);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create project'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Project</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-control" placeholder="My Awesome Project"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="form-control" type="date"
              value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm({...form, color: c})}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusColors = { active: 'var(--green)', completed: 'var(--accent)', 'on-hold': 'var(--yellow)', archived: 'var(--text-3)' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getProjects().then(res => setProjects(res.data.projects)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>◫</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No projects yet</div>
          <div style={{ color: 'var(--text-2)', marginBottom: 24 }}>Create your first project to get started</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <Link to={`/projects/${project._id}`} key={project._id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderTop: `3px solid ${project.color || '#3b82f6'}' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${project.color || '#3b82f6'}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, color: project.color || '#3b82f6'
                  }}>◫</div>
                  {(project.owner?._id === user?._id || project.owner === user?._id) && (
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(project._id, e)}>✕</button>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }} className="truncate">
                  {project.name}
                </div>
                {project.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </div>
                )}

                {/* Task stats */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[['todo','#475569'],['in-progress','#3b82f6'],['done','#10b981']].map(([s, c]) => (
                    <div key={s} style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      <span style={{ color: c, fontWeight: 700 }}>{project.taskStats?.[s] || 0}</span> {s}
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                    <span style={{ fontWeight: 700 }}>{project.taskStats?.total || 0}</span> total
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
                    {(project.members || []).slice(0, 4).map((m, i) => {
                      const n = m.user?.name || '?';
                      const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b'];
                      return (
                        <div key={i} className="avatar" style={{
                          width: 26, height: 26, fontSize: 10, background: colors[i % 4], color: '#fff',
                          marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-card)', zIndex: 4 - i
                        }}>
                          {n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      );
                    })}
                    {project.members?.length > 4 && (
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 8 }}>+{project.members.length - 4}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[project.status] || 'var(--green)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{project.status}</span>
                  </div>
                </div>

                {project.dueDate && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
                    Due {format(new Date(project.dueDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSuccess={p => { setProjects(prev => [p, ...prev]); setShowModal(false); }} />}
    </div>
  );
}
