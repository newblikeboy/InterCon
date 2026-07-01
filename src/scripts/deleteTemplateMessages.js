const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Message = require("../models/Message");

const TEMPLATE_NAME = process.argv[2] || "order_status_update_1781193660071";

async function deleteTemplateMessages() {
  await connectDatabase();

  const filter = { templateName: TEMPLATE_NAME };
  const total = await Message.countDocuments(filter);
  const result = await Message.deleteMany(filter);

  console.log(`Template "${TEMPLATE_NAME}": matched ${total} message(s). Deleted ${result.deletedCount}.`);
}

deleteTemplateMessages()
  .catch((error) => {
    console.error("Failed to delete template messages:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (env.mongoUri) {
      await mongoose.connection.close();
    }
  });
