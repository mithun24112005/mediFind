import { findPharmaciesNearby } from "../utils/searchHelper.js";
import axios from "axios";

export const searchMedicine = async (req, res) => {
  try {
    const { medicine_name, latitude, longitude } = req.body;

    // Step 1️⃣: Fetch nearby pharmacies from DB
    const pharmacies = await findPharmaciesNearby(medicine_name, latitude, longitude);
    if (!pharmacies.length)
      return res.status(404).json({ message: "No pharmacies found nearby" });

    // Step 2️⃣: Send data to Python ML model for scoring
    const { data: mlScores } = await axios.post("http://localhost:5001/predict", pharmacies);

    // Step 3️⃣: Merge scores back into pharmacy list
    const finalResults = pharmacies.map(p => {
      const score = mlScores.find(s => s.pharmacy_id === p.pharmacy_id)?.score || 0;
      return { ...p, score };
    });

    // Step 4️⃣: Sort and send final response
    finalResults.sort((a, b) => b.score - a.score);

    res.json({
      message: "Search completed",
      medicine_name,
      pharmacies: finalResults
    });

  } catch (error) {
    console.error("Error in searchMedicine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
