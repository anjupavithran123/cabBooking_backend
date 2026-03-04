import express from "express";
import { syncUser } from "../controller/userControlller.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();
router.post("/", requireAuth, syncUser);

export default router;