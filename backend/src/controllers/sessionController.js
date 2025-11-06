import Session from "../models/session.model.js";
import Pharmacy from "../models/pharma.model.js";
import Medicine from "../models/medicine.model.js";
import { findPharmaciesNearby } from "../utils/searchHelper.js";

export const searchMedicine = async (req, res) => {
  try {
    const { medicine_name, latitude, longitude } = req.body;
    const session = req.session;

    // 🧠 Update session
    session.search_input = { medicine_name };
    session.user_location = { type: "Point", coordinates: [longitude, latitude] };
    session.timestamp = new Date();
    await session.save();

    // 🏥 Fetch pharmacies that have the medicine
    const results = await findPharmaciesNearby(medicine_name, latitude, longitude);

    res.json({
      message: "Search completed",
      medicine_name,
      pharmacies: results
    });

  } catch (error) {
    console.error("Error in searchMedicine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
