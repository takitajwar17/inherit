/**
 * Clerk Webhook Handler
 * 
 * POST /api/webhooks/clerk
 * 
 * Handles Clerk webhook events for user lifecycle management.
 * Validates webhook signatures using Svix.
 * 
 * Note: This endpoint uses plain Response objects (not NextResponse.json)
 * for compatibility with Clerk webhook verification requirements.
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { createOrUpdateUser, deleteUser } from "@/lib/actions/user";
import logger, { events } from "@/lib/logger";
import { generateRequestId } from "@/lib/errors/apiResponse";

export async function POST(req) {
  const requestId = generateRequestId();
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  // Verify webhook secret is configured
  if (!WEBHOOK_SECRET) {
    logger.error("WEBHOOK_SECRET not configured", { requestId });
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get Svix headers for verification
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Validate required headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn("Clerk webhook received without svix headers", { requestId });
    return new Response(
      JSON.stringify({ error: "Missing svix headers", requestId }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    logger.error("Error verifying Clerk webhook signature", { 
      error: err.message,
      requestId 
    });
    return new Response(
      JSON.stringify({ error: "Invalid webhook signature", requestId }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = evt?.data;
  const eventType = evt?.type;
  
  logger.info("Clerk webhook received", { webhookId: id, eventType, requestId });
  logger.debug("Clerk webhook payload", { body: JSON.parse(body) });

  // Handle user creation and updates
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses, username } = evt?.data;
    
    try {
      const primaryEmail = email_addresses.find(
        email => email.id === evt.data.primary_email_address_id
      )?.email_address;
      
      logger.debug("Processing Clerk user data", { 
        clerkId: id, 
        firstName: first_name, 
        lastName: last_name, 
        email: primaryEmail, 
        username,
        requestId
      });
      
      await createOrUpdateUser(
        id,
        first_name,
        last_name,
        image_url,
        primaryEmail,
        username
      );
      
      if (eventType === "user.created") {
        events.userCreated(null, id);
      } else {
        events.userUpdated(id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${eventType === "user.created" ? "created" : "updated"}`,
          requestId 
        }), 
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      logger.error("Error processing user from Clerk webhook", { 
        clerkId: id, 
        eventType,
        error: error.message,
        requestId
      });
      return new Response(
        JSON.stringify({ error: "Failed to process user", requestId }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Handle user deletion
  if (eventType === "user.deleted") {
    const { id } = evt?.data;
    
    try {
      await deleteUser(id);
      events.userDeleted(id);
      
      return new Response(
        JSON.stringify({ success: true, message: "User deleted", requestId }), 
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      logger.error("Error deleting user from Clerk webhook", { 
        clerkId: id, 
        error: error.message,
        requestId
      });
      return new Response(
        JSON.stringify({ error: "Failed to delete user", requestId }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Acknowledge unhandled event types
  logger.debug("Unhandled Clerk webhook event type", { eventType, requestId });
  return new Response(
    JSON.stringify({ success: true, message: "Event acknowledged", requestId }), 
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
