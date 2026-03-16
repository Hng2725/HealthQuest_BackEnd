const ShopItem = require('../models/ShopItem');
const User = require('../models/User');

/**
 * @swagger
 * /api/shop:
 *   get:
 *     summary: Get all active shop items
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: List of shop items
 */
exports.getShopItems = async (req, res) => {
  try {
    const items = await ShopItem.find({ isActive: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/shop/purchase/{id}:
 *   post:
 *     summary: Purchase an item from the shop
 *     tags: [Shop]
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
 *         description: Item purchased successfully
 *       400:
 *         description: Not enough coins or already owned
 *       404:
 *         description: Item not found
 */
exports.purchaseItem = async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (user.coins < item.price) {
      return res.status(400).json({ message: 'Not enough coins' });
    }

    // Check if background is already owned
    if (
      item.type === 'background' &&
      user.unlockedBackgrounds.includes(item._id)
    ) {
      return res.status(400).json({ message: 'Background already owned' });
    }

    // Deduct coins
    user.coins -= item.price;

    // Apply item logic based on type
    if (item.type === 'background') {
      user.unlockedBackgrounds.push(item._id);
    } else if (item.type === 'avatar') {
      user.avatar = item.imageUrl;
    }

    await user.save();

    res.json({
      message: 'Purchase successful',
      coinsRemaining: user.coins,
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/shop/equip/{id}:
 *   post:
 *     summary: Equip a purchased background
 *     tags: [Shop]
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
 *         description: Background equipped
 *       400:
 *         description: Not owned
 *       404:
 *         description: Item not found
 */
exports.equipBackground = async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!item || item.type !== 'background') {
      return res.status(404).json({ message: 'Background not found' });
    }

    if (!user.unlockedBackgrounds.includes(item._id)) {
      return res.status(400).json({ message: 'You do not own this background' });
    }

    user.currentBackground = item.imageUrl;
    await user.save();

    res.json({
      message: 'Background equipped successfully',
      currentBackground: user.currentBackground,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
