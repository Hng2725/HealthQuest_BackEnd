import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/Task.js';
import ShopItem from './models/ShopItem.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing predefined data
    await Task.deleteMany({ type: 'system' });
    await ShopItem.deleteMany();

    console.log('Cleared old system data.');

    // 1. Seed System Tasks
    const systemTasks = [
      {
        title: 'Drink Water 💧',
        description: 'Drink at least 2 liters of water today.',
        priority: 'Medium',
        category: 'Health',
        type: 'system',
        frequency: 'Daily',
        expReward: 20,
        coinReward: 5,
        status: 'pending'
      },
      {
        title: 'Morning Workout 🏃',
        description: 'Exercise for at least 30 minutes.',
        priority: 'High',
        category: 'Fitness',
        type: 'system',
        frequency: 'Daily',
        expReward: 50,
        coinReward: 15,
        status: 'pending'
      },
      {
        title: 'Read a Book 📚',
        description: 'Read 15 pages of any non-fiction book.',
        priority: 'Low',
        category: 'Productivity',
        type: 'system',
        frequency: 'Daily',
        expReward: 30,
        coinReward: 10,
        status: 'pending'
      }
    ];

    await Task.insertMany(systemTasks);
    console.log('System tasks seeded.');

    // 2. Seed Shop Items (Avatars and Backgrounds)
    const shopItems = [
      // Backgrounds
      {
        name: 'Mystic Forest',
        description: 'A magical animated forest background.',
        type: 'background',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000&auto=format&fit=crop'
      },
      {
        name: 'Cyberpunk City',
        description: 'Neon lights in a futuristic metropolis.',
        type: 'background',
        price: 250,
        imageUrl: 'https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=2000&auto=format&fit=crop'
      },
      {
        name: 'Cozy Tavern',
        description: 'A warm and inviting adventurer tavern.',
        type: 'background',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop'
      },
      // Avatars
      {
        name: 'Knight Paladin',
        description: 'Avatar of a noble knight.',
        type: 'avatar',
        price: 150,
        imageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Knight&backgroundColor=b6e3f4'
      },
      {
        name: 'Shadow Ninja',
        description: 'Avatar of a stealthy assassin.',
        type: 'avatar',
        price: 150,
        imageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ninja&backgroundColor=c0aede'
      },
      {
        name: 'Arch Mage',
        description: 'Avatar of a powerful wizard.',
        type: 'avatar',
        price: 150,
        imageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mage&backgroundColor=ffdfbf'
      }
    ];

    await ShopItem.insertMany(shopItems);
    console.log('Shop items seeded.');

    console.log('✅ Database Seeding Completed Successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
