// createStripeAccount.js

import Stripe from "stripe";
import supabase from "../config/supabase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createDriverStripeAccount = async (req, res) => {
  try {
    const { driverId } = req.body;

    const { data: driver } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", driverId)
      .single();

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // Create Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "IN",
      email: driver.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Save stripe_account_id
    await supabase
      .from("drivers")
      .update({ stripe_account_id: account.id })
      .eq("id", driverId);

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:5173/driver/reauth",
      return_url: "http://localhost:5173/driver/dashboard",
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};