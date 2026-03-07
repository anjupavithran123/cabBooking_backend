import supabase from "../config/supabase.js";

// ✅ Save or Update Bank Details
export const saveBankDetails = async (req, res) => {
    try {
  
      const driverId = req.user.id;
  
      const {
        bank_account_number,
        ifsc_code,
        account_holder_name,
        vpa
      } = req.body;
  
      const { data, error } = await supabase
        .from("driver_bank_details")
        .upsert(
          {
            driver_id: driverId,
            bank_account_number,
            ifsc_code,
            account_holder_name,
            vpa,
          },
          { onConflict: "driver_id" }
        );
  
      if (error) throw error;
  
      res.status(200).json({
        message: "Bank details saved successfully",
        data
      });
  
    } catch (error) {
  
      console.error("Bank Save Error:", error);
  
      res.status(500).json({
        message: "Failed to save bank details",
        error: error.message
      });
    }
  };
// ✅ Get Bank Details
export const getBankDetails = async (req, res) => {
    try {
  
      if (!req.user) {
        return res.status(401).json({ message: "Driver not authenticated" });
      }
  
      const driverId = req.user.id;
  
      const { data, error } = await supabase
        .from("driver_bank_details")
        .select("*")
        .eq("driver_id", driverId)
        .single();
  
      if (error) throw error;
  
      res.json(data);
  
    } catch (error) {
  
      console.error("Bank fetch error:", error);
  
      res.status(500).json({
        message: "Failed to fetch bank details"
      });
    }
  };