import Pharmacy from "../models/pharma.model.js";
import bcrypt from "bcrypt";

// 🏪 Register a new pharmacy
export const registerPharmacy = async (req, res) => {
  try {
    const {
      pharmacy_id,
      name,
      owner_name,
      email,
      password,
      phone_number,
      address,
      coordinates
    } = req.body;

    // Check if pharmacy already exists
    const existing = await Pharmacy.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Pharmacy already registered" });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new pharmacy
    const pharmacy = new Pharmacy({
      pharmacy_id,
      name,
      owner_name,
      email,
      password_hash,
      phone_number,
      address,
      location: { type: "Point", coordinates }
    });

    await pharmacy.save();
    res.status(201).json({ message: "Pharmacy registered successfully", pharmacy });

  } catch (error) {
    console.error("Error registering pharmacy:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧠 Login pharmacy (for dashboard / stock upload)
export const loginPharmacy = async (req, res) => {
  try {
    const { email, password } = req.body;

    const pharmacy = await Pharmacy.findOne({ email });
    if (!pharmacy)
      return res.status(404).json({ message: "Pharmacy not found" });

    const isMatch = await bcrypt.compare(password, pharmacy.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", pharmacy_id: pharmacy.pharmacy_id });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 📍 Get all pharmacies (for admin or debugging)
export const getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({});
    res.status(200).json(pharmacies);
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧭 Update pharmacy location or details
export const updatePharmacy = async (req, res) => {
  try {
    const { pharmacy_id } = req.params;
    const updates = req.body;

    const updatedPharmacy = await Pharmacy.findOneAndUpdate(
      { pharmacy_id },
      updates,
      { new: true }
    );

    if (!updatedPharmacy)
      return res.status(404).json({ message: "Pharmacy not found" });

    res.status(200).json({ message: "Pharmacy updated", updatedPharmacy });
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
