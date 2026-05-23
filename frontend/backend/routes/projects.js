const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: check if user is project admin or owner
const isProjectAdmin = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

// @GET /api/projects
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const counts = await Task.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const taskStats = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
      counts.forEach(c => { taskStats[c._id] = c.count; taskStats.total += c.count; });
      return { ...p.toObject(), taskStats };
    }));

    res.json({ success: true, projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/projects
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, description, dueDate, color } = req.body;
    const project = await Project.create({
      name, description, dueDate, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email avatar');
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(m => m.user._id.toString() === req.user._id.toString());

    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/projects/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { name, description, status, dueDate, color } = req.body;
    Object.assign(project, { name, description, status, dueDate, color });
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owner can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/projects/:id/members
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ success: false, message: 'Admin access required' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
