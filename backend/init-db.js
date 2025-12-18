// Database initialization script for SehatSphere
// Run this after setting up MongoDB to create indexes and verify connection

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehatsphere';

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Create indexes
    console.log('\n📊 Creating database indexes...');
    
    await User.createIndexes();
    console.log('✅ User indexes created');
    
    await AuditLog.createIndexes();
    console.log('✅ AuditLog indexes created');
    
    // Verify collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Database collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Get collection stats
    const userCount = await User.countDocuments();
    const auditCount = await AuditLog.countDocuments();
    
    console.log('\n📈 Database statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Audit Logs: ${auditCount}`);
    
    console.log('\n✅ Database initialization complete!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the backend: npm start');
    console.log('   2. Open the frontend in your browser');
    console.log('   3. Create your first account');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure MongoDB is running');
    console.error('   2. Check MONGODB_URI in .env file');
    console.error('   3. Verify network connectivity');
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
