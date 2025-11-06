import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  pharmacy_id: { 
    type: String, 
    required: true 
  },
  medicine_name: { 
    type: String, 
    required: true 
  },
  brand_name: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  stock: { 
    type: Number, 
    required: true 
  },
  expiry_date: { 
    type: Date, 
    required: true 
  },
  last_updated: { 
    type: Date, 
    default: Date.now 
  }
});

// 🔍 Indexes for faster searches
medicineSchema.index({ medicine_name: "text" });
medicineSchema.index({ pharmacy_id: 1 });

export default mongoose.model("Medicine", medicineSchema);
