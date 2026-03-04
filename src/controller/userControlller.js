import { clerkClient } from "@clerk/clerk-sdk-node";
import supabase from "../config/supabase.js";

export const syncUser = async (req, res) => {
  try {
    console.log("STEP 1 - req.user:", req.user);

    const clerkUserId = req.user?.sub;
    if (!clerkUserId) {
      console.log("NO clerkUserId");
      return res.status(400).json({ error: "No Clerk ID" });
    }

    console.log("STEP 2 - fetching Clerk user");

    const user = await clerkClient.users.getUser(clerkUserId);

    console.log("STEP 3 - Clerk user:", user);

    const email = user.emailAddresses?.[0]?.emailAddress;
    const firstName = user.firstName;

    console.log("STEP 4 - email:", email);

    // ✅ Use onConflict to prevent duplicate email errors
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: clerkUserId,
          email,
          name: firstName,
          role: "rider",
        },
        { onConflict: "clerk_id" } // <-- key fix
      )
      .select();

    console.log("STEP 5 - Supabase response:", { data, error });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ User synced successfully");

    res.status(200).json({
      message: "User synced successfully",
      data,
    });

  } catch (err) {
    console.log("❌ SERVER CRASH:", err);
    res.status(500).json({ error: err.message });
  }
};