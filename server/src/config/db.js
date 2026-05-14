const mongoose = require('mongoose');

const MAX_RETRIES  = 5;
const RETRY_DELAY  = 3000; // ms

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`\n✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect…');
      setTimeout(() => connectDB(1), RETRY_DELAY);
    });

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);

    if (retries > 0) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000}s… (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectDB(retries - 1);
    }

    console.warn('\n⚠️  Max retries reached. Server will start, but database operations will fail until MongoDB is running.');
    // process.exit(1); // Commented out so the server doesn't crash
  }
};

module.exports = connectDB;
