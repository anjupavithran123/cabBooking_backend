import supabase from "../config/supabase.js";

/**
 * Get available rides near a driver
 */
export const getNearbyRides = async (req, res) => {
  try {
    let { driver_lat, driver_lng, max_distance_km } = req.query;

    if (!driver_lat || !driver_lng) {
      return res.status(400).json({ error: "Missing driver location" });
    }

    driver_lat = parseFloat(driver_lat);
    driver_lng = parseFloat(driver_lng);
    max_distance_km = parseFloat(max_distance_km) || 100; // default 20km
    

    const { data: rides, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending");

    if (error) throw error;

    console.log("All requested rides:", rides);

    const nearbyRides = rides.filter((ride) => {
      if (!ride.pickup_lat || !ride.pickup_lng) return false;

      const distance = getDistanceFromLatLonInKm(
        driver_lat,
        driver_lng,
        parseFloat(ride.pickup_lat),
        parseFloat(ride.pickup_lng)
      );

      console.log("Distance to ride:", ride.id, distance);

      return distance <= max_distance_km;
    });

    console.log("Nearby rides filtered:", nearbyRides);

    res.json({ rides: nearbyRides });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
/**
 * Driver accepts a ride
 */
export const acceptRide = async (req, res) => {
  try {
    const { ride_id, driver_id } = req.body;

    if (!ride_id || !driver_id) {
      return res.status(400).json({ error: "Missing ride_id or driver_id" });
    }

    const { data, error } = await supabase
      .from("rides")
      .update({ driver_id, status: "accepted" })
      .eq("id", ride_id)
      .single();

    if (error) throw error;

    res.json({ message: "Ride accepted", ride: data });
  } catch (err) {
    console.error("acceptRide error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Haversine formula to calculate distance between two coordinates in km
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


export const updateDriverLocation = async (req, res) => {
  try {
    const { driver_id, lat, lng } = req.body;

    console.log("Updating driver:", driver_id, lat, lng);

    const { error } = await supabase
      .from("drivers")
      .update({
        current_lat: lat,
        current_lng: lng,
      })
      .eq("id", driver_id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Location updated successfully" });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get driver profile
 */
export const getDriverProfile = async (req, res) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ error: "Missing driver_id" });

    const { data, error } = await supabase
      .from("drivers")
      .select("id, name, email, phone, vehicle_type, vehicle_number, avatar_url, current_lat, current_lng")
      .eq("id", driver_id)
      .single();

    if (error) throw error;

    res.json({ driver: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update driver profile
 */
export const updateDriverProfile = async (req, res) => {
  try {
    const { driver_id, name, phone, vehicle_type, vehicle_number, avatar_url, payment_per_km } = req.body;

    if (!driver_id) return res.status(400).json({ error: "Missing driver_id" });

    const updates = { name, phone, vehicle_type, vehicle_number, avatar_url, payment_per_km };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabase
      .from("drivers")
      .update(updates)
      .eq("id", driver_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Profile updated successfully", driver: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


