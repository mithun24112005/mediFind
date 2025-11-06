const mongoose = require("mongoose");

async function connectDB() {
  try {
    console.log("MONGODB_URI from env:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI,
      { useNewUrlParser: true, useUnifiedTopology: true }); 
    
    console.log("Database connected to Atlas");
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
}

module.exports = connectDB;