import express from "express";
import multer from "multer";
import { processPrescription } from "../controllers/ocrController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), processPrescription);

export default router;
