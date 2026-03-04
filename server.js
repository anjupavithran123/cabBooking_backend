import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "./.env") });

import express from "express";
import cors from "cors";

import riderRoutes from "./src/routes/riderRoute.js";
import driverRoutes from "./src/routes/driverRoutes.js";
import driverauthRoute from "./src/routes/driverauthRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import rideRoute from "./src/routes/riderout.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import stripeRoutes from "./src/routes/stripeRoutes.js";

import { verifyPaymentWebhook } from "./src/controller/paymentcontroller.js";

const app = express();

app.use(cors());

/* ======================================================
   ✅ CASHFREE WEBHOOK (MUST BE BEFORE express.json)
====================================================== */
app.use("/api/payment/webhook", express.raw({ type: "*/*" }));


/* ======================================================
   ✅ NORMAL JSON ROUTES
====================================================== */
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Cab Booking API Running 🚖");
});

app.use("/api/users", userRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/rides", rideRoute);
app.use("/api/driver", driverRoutes);
app.use("/api/driver/auth", driverauthRoute);
app.use("/api/payment", paymentRoutes);
app.use("/api/stripe", stripeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});