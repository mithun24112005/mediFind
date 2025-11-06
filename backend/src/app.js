import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import routes
import medicineRoutes from "./routes/medicineRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend
    credentials: true, // Allow cookies and headers
  })
);

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

export default app;
