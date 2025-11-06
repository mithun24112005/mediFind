import fs from "fs";
import csv from "csv-parser";
import Medicine from "../models/medicine.model.js";
import Pharmacy from "../models/pharma.model.js";

// 🧾 Add new medicine stock
export const addMedicine = async (req, res) => {
  try {
    const { pharmacy_id, medicine_name, brand_name, price, stock, expiry_date } = req.body;

    // ✅ Verify the pharmacy exists
    const pharmacy = await Pharmacy.findOne({ pharmacy_id });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    // ✅ Check if medicine already exists (same name under this pharmacy)
    const existing = await Medicine.findOne({ pharmacy_id, medicine_name });
    if (existing) {
      return res.status(400).json({
        message: "Medicine already exists — try updating instead"
      });
    }

    // ✅ Create new medicine entry
    const medicine = new Medicine({
      pharmacy_id,
      medicine_name,
      brand_name,
      price,
      stock,
      expiry_date
    });

    await medicine.save();
    res.status(201).json({ message: "Medicine added successfully", medicine });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✏️ Update medicine stock, price, or expiry
export const updateMedicine = async (req, res) => {
  try {
    const { pharmacy_id, medicine_name } = req.params;
    const updates = req.body;

    const medicine = await Medicine.findOneAndUpdate(
      { pharmacy_id, medicine_name },
      { ...updates, last_updated: new Date() },
      { new: true }
    );

    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    res.status(200).json({ message: "Medicine updated successfully", medicine });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 📦 Get all medicines of a pharmacy
export const getPharmacyStock = async (req, res) => {
  try {
    const { pharmacy_id } = req.params;

    const medicines = await Medicine.find({ pharmacy_id });
    if (!medicines.length)
      return res.status(404).json({ message: "No medicines found for this pharmacy" });

    res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🗑️ Delete a medicine from stock
export const deleteMedicine = async (req, res) => {
  try {
    const { pharmacy_id, medicine_name } = req.params;

    const deleted = await Medicine.findOneAndDelete({ pharmacy_id, medicine_name });
    if (!deleted) return res.status(404).json({ message: "Medicine not found" });

    res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const uploadMedicineCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  try {
    const medicines = [];

    // 👇 Pharmacy ID can come from body or query (from frontend)
    const pharmacy_id = req.body.pharmacy_id || req.query.pharmacy_id;

    if (!pharmacy_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Missing pharmacy_id" });
    }

    // ✅ Verify pharmacy exists
    const pharmacy = await Pharmacy.findOne({ pharmacy_id });
    if (!pharmacy) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // ✅ Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          medicines.push({
            pharmacy_id, // 👈 Attach the logged-in pharmacy ID
            medicine_name: row.medicine_name,
            brand_name: row.brand_name || "",
            price: parseFloat(row.price),
            stock: parseInt(row.stock),
            expiry_date: new Date(row.expiry_date),
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(req.file.path); // remove temp file

    if (!medicines.length) {
      return res.status(400).json({ message: "Empty CSV file" });
    }

    await Medicine.insertMany(medicines);

    res.status(201).json({
      message: "CSV uploaded successfully",
      count: medicines.length,
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


