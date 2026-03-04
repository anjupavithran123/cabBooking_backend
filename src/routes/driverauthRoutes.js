import express from "express";
import { signupDriver, loginDriver } from "../controller/driverauthcontroller.js";

const router = express.Router();

/// Use /api/driver/auth for auth endpoints
router.post("/signup", signupDriver);
router.post("/login", loginDriver);

export default router;