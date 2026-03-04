import axios from "axios";
import supabase from "../config/supabase.js";
import { calculateFare } from "../utils/fareCalculator.js";

const BASE_URL = process.env.CASHFREE_BASE_URL; // https://sandbox.cashfree.com/pg
const PAYOUT_URL = process.env.CASHFREE_PAYOUT_URL; // https://sandbox.cashfree.com/payout

/* ======================================================
   1️⃣ CREATE PAYMENT ORDER
====================================================== */
export const createPaymentOrder = async (req, res) => {
  try {
    console.log("STEP 1 - Request body:", req.body);

    const { rideId } = req.body;

    if (!rideId) {
      console.log("STEP 2 - Ride ID missing");
      return res.status(400).json({ message: "Ride ID is required" });
    }

    console.log("STEP 3 - Fetching ride from DB");

    const { data: ride, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    console.log("STEP 4 - Supabase response:", ride);
    console.log("STEP 5 - Supabase error:", error);

    if (error || !ride) {
      return res.status(400).json({ message: "Ride not found" });
    }

    console.log("STEP 6 - Ride Fare:", ride. estimated_fare);

    const amount = Number(ride. estimated_fare);

    console.log("STEP 7 - Amount:", amount);

    console.log("STEP 8 - Calling Cashfree...");

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: `order_${Date.now()}`,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_001",
          customer_email: "test@test.com",
          customer_phone: "9999999999",
        },
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("STEP 9 - Cashfree Response:", response.data);

    res.json({
      payment_session_id: response.data.payment_session_id,
    });

  } catch (err) {
    console.error("ERROR OCCURRED:");
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Payment order failed" });
  }
};

/* ======================================================
   2️⃣ VERIFY PAYMENT WEBHOOK
====================================================== */
export const verifyPaymentWebhook = async (req, res) => {
  try {
    const orderId = req.body.order?.order_id;
    const paymentStatus = req.body.payment?.payment_status;
    const paymentId = req.body.payment?.cf_payment_id;

    if (!orderId) {
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    if (paymentStatus === "SUCCESS") {

      // Extract original rideId
      const rideId = orderId.split("_")[1];

      await supabase
        .from("rides")
        .update({
          payment_status: "paid",
          cashfree_payment_id: paymentId,
          status: "completed",
          paid_at: new Date(),
        })
        .eq("id", rideId);

      await transferToDriver(rideId);
    }

    return res.json({ received: true });

  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(500).json({ error: "Webhook failed" });
  }
};

/* ======================================================
   3️⃣ TRANSFER MONEY TO DRIVER (PAYOUT)
====================================================== */
const transferToDriver = async (rideId) => {
  try {
    const { data: ride } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (!ride) return;

    await axios.post(
      `${PAYOUT_URL}/transfers`,
      {
        beneId: ride.driver_id,
        amount: ride.driver_amount,
        transferId: `transfer_${rideId}_${Date.now()}`,
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    await supabase
      .from("rides")
      .update({
        payout_status: "success",
        payout_reference_id: `transfer_${rideId}`,
      })
      .eq("id", rideId);

  } catch (err) {
    console.error("Payout Error:", err.response?.data || err.message);
  }
};