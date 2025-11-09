import { GoogleGenerativeAI } from "@google/generative-ai";

export const suggestAlternates = async (req, res) => {
  try {
    const { medicine_name } = req.body;
    if (!medicine_name || medicine_name.trim() === "") {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
You are a pharmaceutical expert...
Suggest 5 alternate medicines for "${medicine_name}" ...
Respond as JSON array.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let alternatives = [];
    try {
      alternatives = JSON.parse(text);
    } catch {
      alternatives = text
        .replace(/[\[\]]/g, "")
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    res.status(200).json({
      message: "Alternate medicines generated successfully",
      medicine_name,
      alternatives,
    });

  } catch (error) {
    console.error("❌ Gemini AI Error:", error);
    res.status(500).json({
      message: "Failed to generate alternate medicines",
      error: error.message,
    });
  }
};
