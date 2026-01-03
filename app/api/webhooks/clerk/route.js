import { Webhook } from "svix";
import { headers } from "next/headers";
import { createOrUpdateUser, deleteUser } from "@/lib/actions/user";
import logger, { events } from "@/lib/logger";

/**
 * Clerk Webhook Handler
 * 
 * POST /api/webhooks/clerk
 * 
 * Handles Clerk webhook events for user lifecycle management.
 * Validates webhook signatures using Svix.
 */
export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn("Clerk webhook received without svix headers");
    return new Response("Error occurred -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    logger.error("Error verifying Clerk webhook", { error: err.message });
    return new Response("Error occurred", { status: 400 });
  }

  const { id } = evt?.data;
  const eventType = evt?.type;
  
  logger.info("Clerk webhook received", { webhookId: id, eventType });
  logger.debug("Clerk webhook payload", { body: JSON.parse(body) });

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses, username } = evt?.data;
    try {
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)?.email_address;
      
      logger.debug("Processing Clerk user data", { 
        clerkId: id, 
        firstName: first_name, 
        lastName: last_name, 
        email: primaryEmail, 
        username 
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
      
      return new Response(`User is ${eventType === "user.created" ? "created" : "updated"}`, { status: 200 });
    } catch (error) {
      logger.error("Error creating or updating user from Clerk webhook", { 
        clerkId: id, 
        error: error.message 
      });
      return new Response("Error occurred", { status: 400 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt?.data;
    try {
      await deleteUser(id);
      events.userDeleted(id);
      return new Response("User is deleted", { status: 200 });
    } catch (error) {
      logger.error("Error deleting user from Clerk webhook", { 
        clerkId: id, 
        error: error.message 
      });
      return new Response("Error occurred", { status: 400 });
    }
  }

  return new Response("", { status: 200 });
}
