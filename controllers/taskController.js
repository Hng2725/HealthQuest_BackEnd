const Task = require('../models/Task');
const User = require('../models/User');

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get user's custom tasks and all system tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 */
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ type: 'system' }, { user: req.user._id }],
    }).sort({ createdAt: -1 });

    const today = new Date().toISOString().split('T')[0];
    const user = await User.findById(req.user._id);

    // Map tasks to include the dynamic status for Daily tasks
    const tasksWithStatus = tasks.map(task => {
      const taskObj = task.toObject();
      if (task.frequency === 'Daily') {
        const logs = user.dailyQuestLogs || [];
        const isCompletedToday = logs.some(
          log => log.taskId && log.taskId.toString() === task._id.toString() && log.date === today
        );
        taskObj.status = isCompletedToday ? 'completed' : 'pending';
      }
      return taskObj;
    });

    res.json(tasksWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a custom task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               category:
 *                 type: string
 *               expReward:
 *                 type: number
 *               coinReward:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 */
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, category, expReward, coinReward, deadline, frequency } = req.body;

    const task = new Task({
      user: req.user._id,
      title,
      description,
      priority,
      category,
      type: 'custom',
      expReward,
      coinReward,
      deadline,
      frequency,
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a custom task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               category:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found or not authorized
 */
exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, category, deadline, frequency } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
      if (task.type === 'system') {
        return res.status(400).json({ message: 'Cannot edit system tasks directly' });
      }

      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized to update this task' });
      }

      task.title = title || task.title;
      task.description = description || task.description;
      task.priority = priority || task.priority;
      task.category = category || task.category;
      task.deadline = deadline || task.deadline;
      task.frequency = frequency || task.frequency;

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a custom task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task removed
 *       404:
 *         description: Task not found or not authorized
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task) {
      if (task.type === 'system') {
        return res.status(400).json({ message: 'Cannot delete system tasks' });
      }

      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized to delete this task' });
      }

      await Task.deleteOne({ _id: task._id });
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Complete a task and earn rewards
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task completed, rewards added
 *       400:
 *         description: Task already completed
 *       404:
 *         description: Task not found
 */
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const user = await User.findById(req.user._id);
    const today = new Date().toISOString().split('T')[0];

    // Check if task was already completed today (if Daily)
    if (task.frequency === 'Daily') {
      if (!user.dailyQuestLogs) user.dailyQuestLogs = [];
      const alreadyDone = user.dailyQuestLogs.some(
        log => log.taskId && log.taskId.toString() === task._id.toString() && log.date === today
      );
      if (alreadyDone) {
        return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này hôm nay rồi!' });
      }
      // Add to daily log
      user.dailyQuestLogs.push({ taskId: task._id, date: today });
    } else {
      // For 'Once' tasks
      if (task.status === 'completed') {
        return res.status(400).json({ message: 'Nhiệm vụ này đã được hoàn thành' });
      }
      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();
    }

    // Grant rewards
    user.exp += task.expReward;
    user.coins += task.coinReward;

    // Leveling logic: 100 EXP per level (simplified)
    const expNeeded = user.level * 100;
    if (user.exp >= expNeeded && user.level < 30) {
      user.level += 1;
      user.exp -= expNeeded;
    }

    await user.save();

    res.json({
      message: 'Hoàn thành nhiệm vụ thành công!',
      rewards: {
        expAdded: task.expReward,
        coinsAdded: task.coinReward,
        newLevel: user.level,
        newExp: user.exp,
        newCoins: user.coins
      }
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: Get task completion statistics
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics data
 */
exports.getTaskStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('dailyQuestLogs.taskId');
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Daily Stats (Breaking down today's completed tasks by category)
    const dailyCompleted = [];
    
    // From daily logs
    if (user.dailyQuestLogs) {
      user.dailyQuestLogs.forEach(log => {
        if (log.date === todayStr && log.taskId) {
          dailyCompleted.push({
            title: log.taskId.title,
            category: log.taskId.category,
            type: 'Daily'
          });
        }
      });
    }
    
    // From one-time tasks
    const startOfToday = new Date(todayStr);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    
    const onceTasksToday = await Task.find({
      user: req.user._id,
      frequency: 'Once',
      status: 'completed',
      completedAt: {
        $gte: startOfToday,
        $lt: endOfToday
      }
    });
    
    onceTasksToday.forEach(task => {
      dailyCompleted.push({
        title: task.title,
        category: task.category,
        type: 'Once'
      });
    });

    const dailyStats = dailyCompleted.reduce((acc, curr) => {
      const categoryName = curr.category || 'Other';
      const idx = acc.findIndex(item => item.name === categoryName);
      if (idx > -1) {
        acc[idx].value += 1;
      } else {
        acc.push({ name: categoryName, value: 1 });
      }
      return acc;
    }, []);

    // 2. Weekly Stats (Last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Count daily logged tasks for this date
      const dailyCount = user.dailyQuestLogs ? user.dailyQuestLogs.filter(log => log.date === dateStr).length : 0;
      
      // Count once tasks completed on this date
      const startOfDay = new Date(dateStr);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const onceCount = await Task.countDocuments({
        user: req.user._id,
        frequency: 'Once',
        status: 'completed',
        completedAt: { $gte: startOfDay, $lt: endOfDay }
      });
      
      weeklyData.push({
        date: dateStr,
        day: dayName,
        completed: dailyCount + onceCount
      });
    }

    res.json({
      daily: dailyStats,
      weekly: weeklyData
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ message: error.message });
  }
};
