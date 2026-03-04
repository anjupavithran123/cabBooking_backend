import express from "express";
import {
  getNearbyRides,
  acceptRide,
  updateDriverLocation,
  getDriverProfile, updateDriverProfile, 
} from "../controller/driverController.js";

const router = express.Router();

// Ride-related routes
router.get("/rides/nearby", getNearbyRides);
router.post("/rides/accept", acceptRide);
router.post("/location/update", updateDriverLocation);

// ✅ Driver profile routes
router.get("/profile", getDriverProfile);       // fetch driver profile
router.put("/profile", updateDriverProfile);    // update driver profile
export default router;