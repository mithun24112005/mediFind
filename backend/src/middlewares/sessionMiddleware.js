import Session from "../models/session.model.js";

export const sessionMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Try to get session_id from cookie first, then header
    let session_id = req.cookies?.session_id || req.headers?.session_id;

    // 2️⃣ If no session_id, create a new one
    if (!session_id) {
      session_id = "S" + Date.now();
      console.log("🆕 Creating new session:", session_id);

      // 🍪 Set cookie so user can reuse this session later
      res.cookie("session_id", session_id, {
        httpOnly: true,    // Secure, can't be accessed by JS
        secure: false,     // true in production (HTTPS)
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
    }

    // 3️⃣ Try to find existing session in DB
    let session = await Session.findOne({ session_id });

    // 4️⃣ If no session found, create a new one with default fields
    if (!session) {
      session = await Session.create({
        session_id,
        search_input: { medicine_name: "" },
        user_location: { type: "Point", coordinates: [0, 0] },
        timestamp: new Date()
      });
      console.log("🆕 New session created in DB:", session.session_id);
    }

    // 5️⃣ Attach session to request for controller use
    req.session = session;

    // 6️⃣ Also set session_id header (useful for debugging / Postman)
    res.setHeader("session_id", session.session_id);

    next();
  } catch (error) {
    console.error("❌ Session Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
