import express from "express";
import requireAuth from "../middleware/auth.js";
import {
  getRiderProfile,
  updateRiderProfile,
  getRideHistory,
  getEstimatedFare
} from "../controller/riderController.js";

const router = express.Router();

// Protected routes
router.get("/profile", requireAuth, getRiderProfile);
router.put("/profile", requireAuth, updateRiderProfile);
router.get("/rides", requireAuth, getRideHistory);
router.get("/fare", getEstimatedFare);   

export default router;