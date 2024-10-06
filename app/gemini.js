// Модуль для обработки запросов к Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
let APP;

const generationConfig = {
  stopSequences: ["red"],
  maxOutputTokens: 512,
  temperature: 0.9,
  topP: 0.1,
  topK: 16,
};

module.exports = class GeminiHandler {
  constructor(_app) {
    APP = _app;
    this.API_KEY = APP.SETTINGS.gemini;
    this.genAI = new GoogleGenerativeAI(this.API_KEY);
    APP.LOGGER.log("GeminiHandler constructed", "info");
  }

  // Метод для отправки запроса к Gemini
  async handleRequest(prompt) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig});
    const result = await model.generateContent(prompt);
    APP.LOGGER.log(`Gemini: ${result}`, "info");
    
    const response = await result.response;
    const text = response.text();
    return text;
  }
};