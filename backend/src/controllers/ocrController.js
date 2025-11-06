import Tesseract from "tesseract.js";
import fs from "fs";

export const processPrescription = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imagePath = req.file.path;

    console.log("📄 OCR processing started for:", imagePath);

    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (info) => console.log(info), // optional progress logs
    });

    // Extract raw text
    const extractedText = result.data.text;
    console.log("🧠 OCR extracted:", extractedText);

    fs.unlinkSync(imagePath); // cleanup

    res.json({
      message: "OCR extraction successful",
      text: extractedText,
    });
  } catch (error) {
    console.error("❌ OCR processing failed:", error);
    res.status(500).json({ message: "OCR failed", error: error.message });
  }
};
