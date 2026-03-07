import supabase from "../config/supabase.js";

// 🔹 Get Rider Profile
export const getRiderProfile = async (req, res) => {
  try {
    const clerkUserId = req.user.sub;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", clerkUserId)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Update Rider Profile
export const updateRiderProfile = async (req, res) => {
  try {
    const clerkUserId = req.user.sub;
    const { name, phone, profile_image } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({ name, phone, profile_image })
      .eq("clerk_id", clerkUserId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({
      message: "Profile updated successfully",
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Get Rider Ride History
export const getRideHistory = async (req, res) => {
  try {
    const clerkUserId = req.user.sub;

    // First get internal user id
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("rider_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// src/controller/riderController.js

/**
 * GET /api/fare
 * Calculate estimated fare for a ride
 */
export const getEstimatedFare = async (req, res) => {
  try {
    const { driver_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.query;
    if (!driver_id || !pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Fetch driver's payment rate
    const { data: driver, error } = await supabase
      .from("drivers")
      .select("payment_per_km")
      .eq("id", driver_id)
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Calculate distance
    const distance = getDistanceFromLatLonInKm(
      parseFloat(pickup_lat),
      parseFloat(pickup_lng),
      parseFloat(dropoff_lat),
      parseFloat(dropoff_lng)
    );

    // Calculate fare
    const estimatedFare = distance * (driver.payment_per_km || 0);

    res.json({
      distance: distance.toFixed(2),
      estimatedFare: estimatedFare.toFixed(2),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Haversine formula helper
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

