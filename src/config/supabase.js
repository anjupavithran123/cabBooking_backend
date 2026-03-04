import dotenv from "dotenv";
dotenv.config(); // 🔥 load env here directly

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase env variables missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;