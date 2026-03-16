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

    res.json(tasks);
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
    const { title, description, priority, category, expReward, coinReward, deadline } = req.body;

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
    const { title, description, priority, category, deadline } = req.body;

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

    if (task) {
      if (task.status === 'completed') {
        return res.status(400).json({ message: 'Task is already completed' });
      }

      // If it's a generic system task, we could duplicate it for the user. 
      // For simplicity in this demo, let's assume the user completes the system template directly if allowed, 
      // or we handle tracking differently. Let's just track it on the user side for now.
      
      const user = await User.findById(req.user._id);
      
      if (task.type !== 'system') {
        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();
      }

      // If it's a system task, we don't save the 'completed' status globally because it's a template for all users.
      // We just directly grant the rewards to the user.

      user.exp += task.expReward;
      user.coins += task.coinReward;

      // Leveling logic: 100 EXP per level (simplified)
      const expNeeded = user.level * 100;
      if (user.exp >= expNeeded && user.level < 30) {
        user.level += 1;
        user.exp -= expNeeded; // carry over
      }

      await user.save();

      res.json({
        message: 'Task completed successfully',
        rewards: {
          expAdded: task.expReward,
          coinsAdded: task.coinReward,
          newLevel: user.level,
          newExp: user.exp,
          newCoins: user.coins
        }
      });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
