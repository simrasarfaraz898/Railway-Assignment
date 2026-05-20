import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getProjectTasks, createTask, updateTask, deleteTask, addMember, removeMember, searchUsers, updateProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: '#475569', 'in-progress': '#3b82f6', review: '#8b5cf6', done: '#10b981' };
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#fbbf24', high: '#fb923c', urgent: '#f87171' };

function Avatar({ name, size = 28 }) {
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const init = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  return <div className="avatar" style={{ width: size, height: size, background: bg, color: '#fff', fontSize: size * 0.35 }}>{init}</div>;
}

function TaskModal({ task, project, onClose, onSuccess }) {
  const { user } = useAuth();
  const isNew = !task;
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    assignee: task?.assignee?._id || '', status: task?.status || 'todo',
    priority: task?.priority || 'medium', dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = { ...form, project: project._id, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (!data.assignee) delete data.assignee;
      const res = isNew ? await createTask(data) : await updateTask(task._id, data);
      onSuccess(res.data.task, !isNew);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save task'); }
    finally { setLoading(false); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await addComment(task._id, { text: comment });
      setComments(res.data.comments);
      setComment('');
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isNew ? 'New Task' : 'Edit Task'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" placeholder="Task title..." value={form.title}
              onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" placeholder="Describe the task..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assignee</label>
              <select className="form-control" value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}>
                <option value="">Unassigned</option>
                {project.members?.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="form-control" type="date" value={form.dueDate}
                onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input className="form-control" placeholder="design, frontend, bug"
              value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}</button>
          </div>
        </form>

        {/* Comments section for existing tasks */}
        {!isNew && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>Comments ({comments.length})</div>
            {comments.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <Avatar name={c.user?.name} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 2 }}>{c.user?.name} · {format(new Date(c.createdAt), 'MMM d, h:mm a')}</div>
                  <div style={{ fontSize: 13, background: 'var(--bg-3)', padding: '8px 12px', borderRadius: 8 }}>{c.text}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input className="form-control" placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={handleComment}>Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MembersModal({ project, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleAdd = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await addMember(project._id, { email, role });
      onUpdate(res.data.project);
      setEmail('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to add member'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeMember(project._id, userId);
      onUpdate({ ...project, members: project.members.filter(m => m.user._id !== userId) });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Team Members</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          {project.members?.map(m => (
            <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={m.user.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.user.email}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {m.user._id !== user._id && (
                <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.user._id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="form-control" placeholder="user@email.com" type="email"
              value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1 }} />
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)} style={{ width: 'auto' }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={loading}>Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [membersModal, setMembersModal] = useState(false);
  const [view, setView] = useState('kanban'); // kanban | list

  useEffect(() => {
    Promise.all([getProject(id), getProjectTasks(id)])
      .then(([proj, tasksRes]) => {
        setProject(proj.data.project);
        setTasks(tasksRes.data.tasks);
      })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTaskSuccess = (task, isEdit) => {
    if (isEdit) setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    else setTasks(prev => [task, ...prev]);
    setTaskModal(null);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    try {
      const res = await updateTask(taskId, { ...task, status: newStatus, assignee: task.assignee?._id });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t));
    } catch {}
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setTaskModal(null);
  };

  const isAdmin = project?.owner?._id === user?._id || project?.members?.find(m => m.user._id === user?._id)?.role === 'admin';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {});

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <span onClick={() => navigate('/projects')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>Projects</span>
          <span>›</span> <span>{project.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color || '#3b82f6' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{project.name}</div>
            </div>
            {project.description && <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>{project.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {['kanban','list'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '6px 14px', border: 'none', fontSize: 12, fontWeight: 500,
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-2)', transition: 'all 0.15s', cursor: 'pointer'
                }}>{v === 'kanban' ? '⊞ Board' : '☰ List'}</button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setMembersModal(true)}>👥 Team ({project.members?.length})</button>
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Task</button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                  <span className="kanban-col-title" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="kanban-count">{tasksByStatus[status].length}</span>
              </div>
              {tasksByStatus[status].map(task => (
                <div key={task._id} className="task-card" onClick={() => setTaskModal(task)}>
                  <div className="task-card-title">{task.title}</div>
                  <div className="task-card-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.assignee && <Avatar name={task.assignee.name} size={22} />}
                    {task.dueDate && (
                      <span style={{ fontSize: 10, color: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text-3)' }}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                  {task.tags?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 10, background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-2)' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setTaskModal('new')} style={{
                width: '100%', background: 'none', border: '1px dashed var(--border)', borderRadius: 8,
                color: 'var(--text-3)', padding: '8px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                marginTop: 4
              }} onMouseOver={e => { e.target.style.borderColor = STATUS_COLORS[status]; e.target.style.color = STATUS_COLORS[status]; }}
                onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-3)'; }}>
                + Add task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                {['Task','Status','Priority','Assignee','Due Date',''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id} onClick={() => setTaskModal(task)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                    {task.tags?.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {task.tags.slice(0,2).map(t => <span key={t} style={{ fontSize: 10, background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 4, color: 'var(--text-2)' }}>{t}</span>)}
                    </div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={task.assignee.name} size={24} />
                        <span style={{ fontSize: 12 }}>{task.assignee.name}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {task.dueDate ? (
                      <span style={{ fontSize: 12, color: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text-2)' }}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => { e.stopPropagation(); handleDelete(task._id); }}>
                    <button className="btn btn-danger btn-sm">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>No tasks yet. Click "+ Task" to create one.</div>
          )}
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          project={project}
          onClose={() => setTaskModal(null)}
          onSuccess={handleTaskSuccess}
        />
      )}
      {membersModal && (
        <MembersModal
          project={project}
          onClose={() => setMembersModal(false)}
          onUpdate={updated => setProject(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
