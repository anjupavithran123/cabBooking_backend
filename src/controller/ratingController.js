import supabase from "../config/supabase.js";
export const submitRating = async (req, res) => {
    try {
      console.log("Request body:", req.body);
  
      const { rideId, driverId, riderId, rating, review } = req.body;
  
      const { data, error } = await supabase
        .from("ratings")
        .insert([
          {
            ride_id: rideId,
            driver_id: driverId,
            rider_id: riderId,
            rating,
            review,
          },
        ])
        .select();
  
      if (error) {
        console.log("Supabase error:", error);
        throw error;
      }
  
      res.json(data);
    } catch (err) {
      console.log("Controller error:", err);
      res.status(500).json({ error: err.message });
    }
  };

  export const getDriverRating = async (req, res) => {
    try {
      const { driverId } = req.params; // must match route
  
      if (!driverId) {
        return res.status(400).json({ error: "driverId required" });
      }
  
      const { data, error } = await supabase
        .from("ratings")
        .select("rating, review")
        .eq("driver_id", driverId);
  
      if (error) throw error;
  
      if (!data || data.length === 0) {
        return res.json({
          averageRating: 0,
          totalReviews: 0,
          reviews: []
        });
      }
  
      const totalReviews = data.length;
  
      const averageRating =
        data.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  
      res.json({
        averageRating: averageRating.toFixed(1),
        totalReviews,
        reviews: data
      });
  
    } catch (err) {
      console.error("Rating error:", err);
      res.status(500).json({ error: err.message });
    }
  };