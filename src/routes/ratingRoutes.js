import express from "express";
import { submitRating, getDriverRating } from "../controller/ratingController.js";

const router = express.Router();

router.post("/submit", submitRating);
router.get("/driver/:driverId", getDriverRating);

export default router;