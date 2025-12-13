import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(message, geminiKey) {
  if (!geminiKey) throw new Error("GEMINI_KEY not set");
  
  const genAI = new GoogleGenerativeAI(geminiKey);
  
  try {
    // Use a specific, consistent model causing less latency and errors
    // gemini-1.5-flash is generally faster and efficient for chat
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Safety settings could be added here if needed, but defaults are usually fine for general retrieval
    
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    if (text) {
      return text;
    }
    
    throw new Error("Empty response from Gemini");
    
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // If flash fails, we could try a fallback like gemini-pro if strictly needed,
    // but usually if one fails due to key/quota, others will too.
    // However, specifically handling 404 for model not found could be useful:
    if (error.message.includes("404") || error.message.includes("not found")) {
        console.warn("gemini-1.5-flash not found, trying gemini-pro");
        try {
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultPro = await modelPro.generateContent(message);
            const responsePro = await resultPro.response;
            return responsePro.text();
        } catch (fallbackError) {
             throw new Error(`Gemini Fallback error: ${fallbackError.message}`);
        }
    }

    throw new Error(`Gemini API error: ${error.message}`);
  }
}
