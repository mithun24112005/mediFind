// Create server
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Import routes
const medicineRoutes = require("./controllers/medicineController.js")
const pharmacyRoutes = require("./routes/pharmacyRoutes.js");
const searchRoutes = require("./routes/searchRoutes.js");

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: "http://localhost:5173", // Your frontend
  credentials: true, // Allow cookies and headers
}));

// ✅ Middleware
app.use(cookieParser());
app.use(express.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ✅ Routes
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api", searchRoutes);

// ✅ Export the app to be used in server.js
module.exports = app;
