import express from "express";
import { checkStripeOnboardingStatus } from "../controller/stripeConnectController.js";

const router = express.Router();

router.get("/status/:driverId", checkStripeOnboardingStatus);

export default router;