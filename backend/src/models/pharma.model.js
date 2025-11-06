import mongoose from "mongoose";

const pharmacySchema = new mongoose.Schema({
  pharmacy_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone_number: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
});

pharmacySchema.index({ location: "2dsphere" }); // enables nearby pharmacy queries

export default mongoose.model("Pharmacy", pharmacySchema);
