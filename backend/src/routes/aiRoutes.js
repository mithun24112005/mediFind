import express from "express";
import { suggestAlternates } from "../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/suggest
router.post("/suggest", suggestAlternates);

export default router;
