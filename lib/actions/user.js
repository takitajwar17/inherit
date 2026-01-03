"use server";

/**
 * User Server Actions
 * 
 * Server-side actions for user management.
 */

import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";
import logger, { logDatabase, events } from "../logger";
import { NotFoundError } from "../errors";

/**
 * Creates or updates a user in the database
 * @param {string} id - Clerk user ID
 * @param {string} first_name - User's first name
 * @param {string} last_name - User's last name
 * @param {string} image_url - User's profile image URL
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} The created/updated user document
 * @throws {Error} If database operation fails
 */
export const createOrUpdateUser = async (
  id, first_name, last_name, image_url, email, username
) => {
  try {
    await connect();
    
    logger.debug("Creating/Updating user", { 
      clerkId: id, 
      firstName: first_name, 
      lastName: last_name, 
      email, 
      username 
    });
    logDatabase("findOneAndUpdate", "User", { clerkId: id });
    
    const user = await User.findOneAndUpdate(
      { clerkId: id },
      {
        $set: {
          firstName: first_name,
          lastName: last_name,
          image_url: image_url,
          email: email,
          userName: username,
        },
      },
      { new: true, upsert: true }
    );
    
    logger.info("User created/updated", { 
      userId: user._id, 
      clerkId: id, 
      username 
    });
    
    return user;
  } catch (error) {
    logger.error("Error creating or updating user", { 
      clerkId: id, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Deletes a user from the database
 * @param {string} id - Clerk user ID
 * @returns {Promise<Object|null>} The deleted user document or null
 * @throws {NotFoundError} If user not found
 */
export const deleteUser = async (id) => {
  try {
    await connect();
    logDatabase("findOneAndDelete", "User", { clerkId: id });
    
    const result = await User.findOneAndDelete({ clerkId: id });
    
    if (result) {
      logger.info("User deleted", { userId: result._id, clerkId: id });
      events.userDeleted(result._id.toString());
    } else {
      logger.warn("User not found for deletion", { clerkId: id });
    }
    
    return result;
  } catch (error) {
    logger.error("Error deleting user", { clerkId: id, error: error.message });
    throw error;
  }
};

/**
 * Finds a user by Clerk ID
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object>} The user document
 * @throws {NotFoundError} If user not found
 */
export const getUserByClerkId = async (clerkId) => {
  try {
    await connect();
    logDatabase("findOne", "User", { clerkId });
    
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      throw new NotFoundError("User");
    }
    
    return user;
  } catch (error) {
    logger.error("Error finding user", { clerkId, error: error.message });
    throw error;
  }
};
