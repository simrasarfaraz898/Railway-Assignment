import React, { useEffect, useState } from 'react';
import { getTasks, updateTask, deleteTask } from '../utils/api';
import { format, isPast } from 'date-fns';

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#fbbf24', high: '#fb923c', urgent: '#f87171' };

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', overdue: false });

  const fetchTasks = () => {
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.priority) params.priority = filter.priority;
    if (filter.overdue) params.overdue = 'true';
    getTasks(params).then(res => setTasks(res.data.tasks)).finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchTasks(); }, [filter]);

  const handleStatusChange = async (task, newStatus) => {
    const res = await updateTask(task._id, { ...task, status: newStatus, assignee: task.assignee?._id, project: task.project?._id });
    setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="form-control" value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          {['todo','in-progress','review','done'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className="form-control" value={filter.priority} onChange={e => setFilter({...filter, priority: e.target.value})} style={{ width: 'auto' }}>
          <option value="">All Priority</option>
          {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <button
          className={`btn ${filter.overdue ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter({...filter, overdue: !filter.overdue, status: filter.overdue ? filter.status : ''})}>
          ⚠ Overdue
        </button>
        {(filter.status || filter.priority || filter.overdue) && (
          <button className="btn btn-secondary" onClick={() => setFilter({ status: '', priority: '', overdue: false })}>Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {filter.overdue ? 'No overdue tasks!' : 'No tasks found'}
          </div>
          <div style={{ color: 'var(--text-2)' }}>{filter.overdue ? 'Great job staying on track.' : 'Tasks assigned to you will appear here.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(task => (
            <div key={task._id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 4, height: 'auto', alignSelf: 'stretch', borderRadius: 4, background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                {task.description && <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{task.description}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.project && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${task.project.color || '#3b82f6'}15`, color: task.project.color || '#60a5fa' }}>
                      {task.project.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span style={{ fontSize: 11, color: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text-3)' }}>
                      📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      {isPast(new Date(task.dueDate)) && task.status !== 'done' && ' (Overdue)'}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <select value={task.status} onChange={e => handleStatusChange(task, e.target.value)}
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                  onClick={e => e.stopPropagation()}>
                  {['todo','in-progress','review','done'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
