const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check project membership
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const isMember = project.owner.toString() === userId.toString() ||
    project.members.some(m => m.user.toString() === userId.toString());
  if (!isMember) return { error: 'Access denied', status: 403 };
  return { project };
};

// @GET /api/tasks - get all tasks for current user (dashboard)
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, overdue } = req.query;
    let query = { assignee: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tasks/project/:projectId
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { taskStatus, priority, assignee } = req.query;
    let query = { project: req.params.projectId };
    if (taskStatus) query.status = taskStatus;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort('createdAt');

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tasks
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('project').notEmpty().withMessage('Project ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, project, assignee, status, priority, dueDate, tags } = req.body;
    const { error, status: errStatus } = await checkProjectAccess(project, req.user._id);
    if (error) return res.status(errStatus).json({ success: false, message: error });

    const task = await Task.create({
      title, description, project, assignee, status, priority, dueDate, tags,
      createdBy: req.user._id
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color owner members')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, status: errStatus } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(errStatus).json({ success: false, message: error });

    const { title, description, assignee, status, priority, dueDate, tags } = req.body;
    Object.assign(task, { title, description, assignee, status, priority, dueDate, tags });
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, status: errStatus } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(errStatus).json({ success: false, message: error });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tasks/:id/comments
router.post('/:id/comments', protect, [
  body('text').trim().notEmpty().withMessage('Comment text required')
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.json({ success: true, comments: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tasks/stats/dashboard
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    // Get projects user is part of
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    const [taskStats, myTaskStats, overdueCount, recentTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { assignee: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments({
        assignee: req.user._id,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      }),
      Task.find({ assignee: req.user._id })
        .populate('project', 'name color')
        .sort('-updatedAt')
        .limit(5)
    ]);

    const formatStats = (arr) => {
      const obj = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
      arr.forEach(s => { obj[s._id] = s.count; obj.total += s.count; });
      return obj;
    };

    res.json({
      success: true,
      stats: {
        allTasks: formatStats(taskStats),
        myTasks: formatStats(myTaskStats),
        overdueCount,
        totalProjects: projectIds.length,
        recentTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
