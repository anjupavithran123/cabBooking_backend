import axios from "axios";
import supabase from "../config/supabase.js";

const CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg";
const CASHFREE_PAYOUT_URL = "https://sandbox.cashfree.com/payout";

/* ======================================================
   1️⃣ CREATE PAYMENT ORDER
====================================================== */
export const createPaymentOrder = async (req, res) => {
  try {

    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID required" });
    }

    /* -----------------------------------
       Get Ride
    ----------------------------------- */

    const { data: ride, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (error || !ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const amount = Number(ride.estimated_fare);

    /* -----------------------------------
       Create Order ID
    ----------------------------------- */

    const orderId = `order_${rideId}_${Date.now()}`;

    /* -----------------------------------
       Call Cashfree API
    ----------------------------------- */

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",

        customer_details: {
          customer_id: ride.rider_id,
          customer_email: "test@test.com",
          customer_phone: "9999999999"
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json"
        }
      }
    );

    const order = response.data;

    /* -----------------------------------
       Save order in Supabase
    ----------------------------------- */

    await supabase
      .from("rides")
      .update({
        cashfree_order_id: orderId,
        payment_session_id: order.payment_session_id
      })
      .eq("id", rideId);

    res.json({
      payment_session_id: order.payment_session_id
    });

  } catch (err) {
    console.error("Create order error:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment order failed" });
  }
};


/* ======================================================
   2️⃣ VERIFY PAYMENT WEBHOOK
====================================================== */

export const verifyPaymentWebhook = async (req, res) => {
  try {

    console.log("Webhook received:", req.body);

    const orderId = req.body.data?.order?.order_id;
    const paymentStatus = req.body.data?.payment?.payment_status;
    const paymentId = req.body.data?.payment?.cf_payment_id;

    if (!orderId) {
      return res.status(400).json({ message: "Invalid webhook data" });
    }

    if (paymentStatus === "SUCCESS") {

      /* -----------------------------------
         Find ride using orderId
      ----------------------------------- */

      const { data: ride, error } = await supabase
        .from("rides")
        .select("*")
        .eq("cashfree_order_id", orderId)
        .single();

      if (error || !ride) {
        console.log("Ride not found for order:", orderId);
        return res.status(404).send("Ride not found");
      }

      /* -----------------------------------
         Update payment status
      ----------------------------------- */

      await supabase
        .from("rides")
        .update({
          payment_status: "paid",
          cashfree_payment_id: paymentId,
          paid_at: new Date(),
          status: "completed"
        })
        .eq("id", ride.id);

      console.log("Payment updated for ride:", ride.id);

      /* -----------------------------------
         Transfer money to driver
      ----------------------------------- */

      await transferToDriver(ride);

    }

    res.status(200).send("Webhook received");

  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).send("Webhook failed");
  }
};


/* ======================================================
   3️⃣ DRIVER PAYOUT
====================================================== */

const transferToDriver = async (ride) => {

  try {

    if (!ride.driver_id) {
      console.log("No driver assigned");
      return;
    }

    const transferId = `transfer_${ride.id}_${Date.now()}`;

    await axios.post(
      `${CASHFREE_PAYOUT_URL}/transfers`,
      {
        beneId: ride.driver_id,
        amount: ride.driver_amount,
        transferId: transferId
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01"
        }
      }
    );

    await supabase
      .from("rides")
      .update({
        payout_status: "success",
        payout_reference_id: transferId
      })
      .eq("id", ride.id);

    console.log("Driver payout successful");

  } catch (err) {
    console.error("Payout error:", err.response?.data || err.message);
  }
};

export const completeRide = async (req, res) => {
  try {
    const { ride_id } = req.body;

    if (!ride_id) {
      return res.status(400).json({ error: "Missing ride_id" });
    }

    const { data, error } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", ride_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Ride completed successfully",
      ride: data,
    });

  } catch (err) {
    console.error("completeRide error:", err);
    res.status(500).json({ error: err.message });
  }
};