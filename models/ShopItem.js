const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['background', 'avatar', 'consumable'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String, // Cloudinary URL
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
module.exports = ShopItem;
