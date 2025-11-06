import express from "express";
import {
  registerPharmacy,
  loginPharmacy,
  getAllPharmacies,
  updatePharmacy
} from "../controllers/pharmacyController.js";

const router = express.Router();

router.post("/register", registerPharmacy);
router.post("/login", loginPharmacy);
router.get("/all", getAllPharmacies);
router.put("/update/:pharmacy_id", updatePharmacy);

export default router;
