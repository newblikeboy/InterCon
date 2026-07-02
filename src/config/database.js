const mongoose = require("mongoose");
const env = require("./env");

async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn("MONGODB_URI is not set. Server will start without database connection.");
    return null;
  }

  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      autoIndex: false,
      maxPoolSize: 20,
      minPoolSize: env.nodeEnv === "production" ? 2 : 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
    const { ensureCriticalIndexes } = require("./indexes");
    await ensureCriticalIndexes();
    console.log("Critical MongoDB indexes verified");
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = {
  connectDatabase
};
