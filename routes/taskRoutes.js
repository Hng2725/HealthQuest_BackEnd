const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTasks).post(protect, createTask);
router.route('/stats').get(protect, getTaskStats);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);
router.route('/:id/complete').patch(protect, completeTask);

module.exports = router;
