/**
 * MongoDB Connection Module
 * 
 * Provides a singleton connection to MongoDB using Mongoose.
 * Ensures only one connection is established and reused.
 */

import mongoose from "mongoose";
import logger from "@/lib/logger";

let initialized = false;

/**
 * Establishes a connection to MongoDB
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
export const connect = async () => {
  mongoose.set("strictQuery", true);

  if (initialized) {
    logger.debug("MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Inherit",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    initialized = true;
    logger.info("MongoDB connected successfully", { dbName: "Inherit" });
  } catch (error) {
    logger.error("MongoDB connection error", { 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
};
