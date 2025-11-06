import express from "express";
import { sessionMiddleware } from "../middlewares/sessionMiddleware.js";
import { searchMedicine } from "../controllers/searchController.js";

const router = express.Router();

router.post("/search_medicine", sessionMiddleware, searchMedicine);

export default router;
