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
    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required" });
    }

    const { data: ride, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (error || !ride) {
      return res.status(400).json({ message: "Ride not found" });
    }

    const amount = Number(ride.estimated_fare);

    // ✅ IMPORTANT: include rideId inside order_id
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: `ride_${rideId}`,  // ✅ FIXED
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: ride.rider_id,
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

    // ✅ THIS IS WHERE YOU ADD SUPABASE UPDATE
    await supabase
      .from("rides")
      .update({
        cashfree_order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id,
        payment_status: "pending",
        status: "awaiting payment",
      })
      .eq("id", rideId);

    return res.json({
      payment_session_id: response.data.payment_session_id,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ message: "Payment order failed" });
  }
};
/* ======================================================
   2️⃣ VERIFY PAYMENT WEBHOOK
====================================================== */
export const verifyPaymentWebhook = async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());

    console.log("🔥 Webhook received:", body);

    const orderId = body?.data?.order?.order_id;
    const paymentStatus = body?.data?.payment?.payment_status;
    const paymentId = body?.data?.payment?.cf_payment_id;

    if (!orderId) {
      return res.status(200).json({ ok: true });
    }

    if (paymentStatus === "SUCCESS") {
      const rideId = orderId.replace("ride_", "");

      const { error } = await supabase
        .from("rides")
        .update({
          payment_status: "paid",
          cashfree_payment_id: paymentId,
          status: "completed",
          paid_at: new Date(),
        })
        .eq("id", rideId);

      if (error) {
        console.log("Update error:", error);
      } else {
        console.log("✅ Ride marked completed");
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.log("Webhook error:", error.message);
    return res.status(200).json({ handled: true });
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