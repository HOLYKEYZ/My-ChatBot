import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(message, geminiKey) {
  if (!geminiKey) throw new Error("GEMINI_KEY not set");
  
  const genAI = new GoogleGenerativeAI(geminiKey);
  
  try {
    // List available models
    const modelList = await genAI.listModels();
    const availableModels = modelList.data?.models || [];
    
    if (availableModels.length === 0) {
      throw new Error("No models available with the provided API key");
    }
    
    // Try each available model until one works
    for (const modelInfo of availableModels) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelInfo.name 
        });
        
        const result = await model.generateContent(message);
        const response = await result.response;
        
        if (response.text) {
          return response.text();
        }
      } catch (error) {
        console.warn(`Model ${modelInfo.name} failed:`, error.message);
        // Continue to the next model
      }
    }
    
    throw new Error("All available models failed to generate a response");
    
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}
