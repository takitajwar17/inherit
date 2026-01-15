import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { pusher } from "../../../lib/pusher";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { socket_id, channel_name } = req.body;

  try {
    // Get user info for presence channel
    const user = await clerkClient.users.getUser(userId);
    const username = user.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim() 
      : user.username || user.emailAddresses[0].emailAddress;

    const presenceData = {
      user_id: userId,
      user_info: {
        username: username,
        // Add specific avatar URL if available, otherwise client uses dicebear
        // avatar: user.imageUrl 
      }
    };

    const auth = pusher.authorizeChannel(socket_id, channel_name, presenceData);
    res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    res.status(500).json({ error: "Auth failed" });
  }
}
