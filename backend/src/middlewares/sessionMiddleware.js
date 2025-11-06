import Session from "../models/session.model.js";

export const sessionMiddleware = async (req, res, next) => {
  try {
    let { session_id } = req.headers;

    // If no session_id in headers, reject or create a new one
    if (!session_id) {
      return res.status(400).json({ message: "Session ID missing" });
    }

    // Try to find session
    let session = await Session.findOne({ session_id });

    // If no session found, create a new one with blank/default fields
    if (!session) {
      session = await Session.create({
        session_id,
        search_input: { medicine_name: "" },
        user_location: { type: "Point", coordinates: [0, 0] }
      });
    }

    // Attach session to request object
    req.session = session;
    next(); // move to next route/controller
  } catch (error) {
    console.error("Session Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
