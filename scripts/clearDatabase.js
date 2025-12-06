require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../src/config/database');

const clearDatabase = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing all collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (let collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Cleared ${collection.name}`);
    }

    console.log('🗑️ Database cleared successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();