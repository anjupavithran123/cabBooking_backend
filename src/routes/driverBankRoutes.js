import express from "express";
import {
  saveBankDetails,
  getBankDetails
} from "../controller/driverBankController.js";

import { protectDriver } from "../middleware/driverAuthMiddleware.js";

const router = express.Router();

router.post("/bank-details", protectDriver, saveBankDetails);
router.get("/bank-details", protectDriver, getBankDetails);

export default router;