import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  session_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  search_input: {
    medicine_name: { 
      type: String, 
      required: true 
    }
  },
  user_location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Geospatial index for distance queries (optional)
sessionSchema.index({ user_location: "2dsphere" });

// Automatically delete session after a set time (e.g., 1 hour)
sessionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.model("Session", sessionSchema);
