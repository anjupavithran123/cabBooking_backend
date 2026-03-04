import express from "express";
import { createRide ,getRiderRideHistory, getDriverRideHistory} from "../controller/ridecontroller.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.post("/create", requireAuth, createRide);
// Rider ride history
router.get("/rider/:riderId",  getRiderRideHistory);

// Driver ride history
router.get("/driver/:driverId",  getDriverRideHistory);

export default router;