import Stripe from "stripe";
import supabase from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const signupDriver = async (req, res) => {
  const { name, email, phone, password, vehicle_number, vehicle_model, vehicle_type } = req.body;

  if (!name || !email || !phone || !password || !vehicle_number || !vehicle_model || !vehicle_type) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Create Stripe Express account
    const stripeAccount = await stripe.accounts.create({
      type: "express",
      country: "IN",
      email: email,
      business_type: "individual",
    });

    // 2️⃣ Insert driver with stripe_account_id
    const { data: driver, error } = await supabase
      .from("drivers")
      .insert([{
        name,
        email,
        phone,
        password: hashedPassword,
        vehicle_number,
        vehicle_model,
        vehicle_type,
        stripe_account_id: stripeAccount.id, // must include if NOT NULL
        stripe_onboarding_complete: false
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    const token = jwt.sign({ id: driver.id, email: driver.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const { password: _, ...driverWithoutPassword } = driver;

    res.status(201).json({ message: "Driver registered successfully", driver: driverWithoutPassword, token });

  } catch (err) {
    console.error("Driver signup error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
// Driver Login
export const loginDriver = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const { data: driver, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("email", email)
      .maybeSingle(); // safer than .single()

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Database error" });
    }

    if (!driver) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: driver.id, email: driver.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔥 IMPORTANT: Never send password back
    const { password: _, ...driverWithoutPassword } = driver;

    return res.status(200).json({
      message: "Login successful",
      token,
      driver: driverWithoutPassword,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};