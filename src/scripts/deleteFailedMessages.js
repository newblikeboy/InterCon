const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Message = require("../models/Message");

async function deleteFailedMessages() {
  await connectDatabase();

  const filter = { status: "failed" };
  const total = await Message.countDocuments(filter);
  const result = await Message.deleteMany(filter);

  console.log(`Matched ${total} failed WhatsApp message(s). Deleted ${result.deletedCount}.`);
}

deleteFailedMessages()
  .catch((error) => {
    console.error("Failed to delete failed WhatsApp messages:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (env.mongoUri) {
      await mongoose.connection.close();
    }
  });
