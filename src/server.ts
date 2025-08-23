import App from "./app";
import prisma from "./config/database";
import { Logger } from "./utils/logger";

// Initialize the application
const app = new App();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  Logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connections
    await prisma.$disconnect();
    Logger.info("Database connections closed");

    process.exit(0);
  } catch (error) {
    Logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  process.exit(1);
});

// Start the server
app.listen();
