import express from "express";
import multer from "multer";
import {
  addMedicine,
  updateMedicine,
  getPharmacyStock,
  deleteMedicine,
  uploadMedicineCSV
} from "../controllers/medicineController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// manual add/update/delete
router.post("/add", addMedicine);
router.put("/:pharmacy_id/:medicine_name", updateMedicine);
router.get("/:pharmacy_id", getPharmacyStock);
router.delete("/:pharmacy_id/:medicine_name", deleteMedicine);
// CSV upload
router.post("/upload_csv", upload.single("file"), uploadMedicineCSV);

export default router;
