const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // If false, it's a global/system task template available to everyone
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['Health', 'Fitness', 'Productivity', 'Self-Care', 'Other'],
      default: 'Other',
    },
    type: {
      type: String,
      enum: ['system', 'custom'],
      default: 'custom',
    },
    expReward: {
      type: Number,
      default: 10,
    },
    coinReward: {
      type: Number,
      default: 5,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
