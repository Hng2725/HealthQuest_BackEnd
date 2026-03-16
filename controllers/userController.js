const User = require('../models/User');

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     summary: Get top 10 users by EXP/Level
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Leaderboard data
 */
exports.getLeaderboard = async (req, res) => {
  try {
    // Sort by level descending, then by exp descending. Limit to 10.
    const topUsers = await User.find({})
      .select('username level exp avatar')
      .sort({ level: -1, exp: -1 })
      .limit(10);

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
