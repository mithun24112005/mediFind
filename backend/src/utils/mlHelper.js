import axios from "axios";

export const getMLScores = async (pharmacies) => {
  try {
    // Send data to Python ML API
    const response = await axios.post("http://localhost:5001/predict", pharmacies);
    return response.data; // [{ pharmacy_id, ai_score }]
  } catch (error) {
    console.error("❌ Error contacting ML model:", error.message);
    return [];
  }
};
