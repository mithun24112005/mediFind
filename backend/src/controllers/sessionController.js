import Session from "../models/session.model.js";

export const updateSession = async (req, res) => {
  try {
    const { session_id, medicine_name, latitude, longitude } = req.body;

    const session = await Session.findOneAndUpdate(
      { session_id },
      {
        search_input: { medicine_name },
        user_location: { type: "Point", coordinates: [longitude, latitude] },
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Session updated", session });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
