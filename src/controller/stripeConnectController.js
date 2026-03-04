import Stripe from "stripe";
import supabase from "../config/supabase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Internal helper
const checkStripeOnboarding = async (driverId) => {
  const { data: driver, error } = await supabase
    .from("drivers")
    .select("stripe_account_id")
    .eq("id", driverId)
    .single();

  if (error || !driver?.stripe_account_id) {
    return false;
  }

  const account = await stripe.accounts.retrieve(
    driver.stripe_account_id
  );

  return account.details_submitted && account.charges_enabled;
};

// 👇 THIS is your API controller
export const checkStripeOnboardingStatus = async (req, res) => {
  try {
    const { driverId } = req.params;

    const isComplete = await checkStripeOnboarding(driverId);

    res.json({ onboardingComplete: isComplete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check status" });
  }
};