const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`InterCon is running on http://localhost:${env.port}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received. Closing HTTP server.`);
    server.close(() => {
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start InterCon API:", error);
  process.exit(1);
});
