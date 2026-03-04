import express from "express";
import {
  createPaymentOrder,
  verifyPaymentWebhook,
} from "../controller/paymentcontroller.js";

const router = express.Router();

router.post("/create-order", createPaymentOrder);
router.post("/webhook", verifyPaymentWebhook);

export default router;