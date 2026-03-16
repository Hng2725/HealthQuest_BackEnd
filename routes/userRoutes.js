const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/userController');

router.route('/leaderboard').get(getLeaderboard);

module.exports = router;
