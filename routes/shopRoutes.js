const express = require('express');
const router = express.Router();
const {
  getShopItems,
  purchaseItem,
  equipBackground,
  unequipBackground,
} = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getShopItems);
router.route('/purchase/:id').post(protect, purchaseItem);
router.route('/equip/:id').post(protect, equipBackground);
router.route('/unequip').post(protect, unequipBackground);

module.exports = router;
