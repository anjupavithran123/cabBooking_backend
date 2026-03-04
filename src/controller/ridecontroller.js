import supabase from "../config/supabase.js";


export const createRide = async (req, res) => {
  try {
    const rider_id = req.user.id; // from Clerk middleware
    const {
      pickup_address,
      dropoff_address,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      ride_type,
      estimated_distance_km,
      estimated_fare
    } = req.body;

    // Validate required fields
    if (!pickup_lat || !dropoff_lat || !pickup_lng || !dropoff_lng) {
      return res.status(400).json({ message: "Pickup and dropoff locations required" });
    }

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          rider_id,
          pickup_address,
          dropoff_address,
          pickup_lat,
          pickup_lng,
          dropoff_lat,
          dropoff_lng,
          ride_type,
          status: "pending",
          estimated_distance_km: parseFloat(estimated_distance_km) || null,
          estimated_fare: parseFloat(estimated_fare) || null
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      ride: data[0]
    });

  } catch (err) {
    console.error("Create ride error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// Fetch ride history for riders
export const getRiderRideHistory = async (req, res) => {
  const { riderId } = req.params;

  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ rides: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ride history", error: err.message });
  }
};

// Fetch ride history for drivers
export const getDriverRideHistory = async (req, res) => {
  const { driverId } = req.params;

  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ rides: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ride history", error: err.message });
  }
};