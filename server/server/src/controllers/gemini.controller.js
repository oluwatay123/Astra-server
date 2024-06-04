const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
require('dotenv').config();
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('API key is missing');
}

const generativeAI = new GoogleGenerativeAI(apiKey);

exports.sendResponse = catchAsync(async (req, res, next) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return next(new AppError("Please provide a prompt", 400));
    }

    // Retrieve the conversation history from the session
    let history = req.session.chatHistory || [];

    // Add the new user message to the history
    history.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const model = generativeAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Your name is Astra and i am your creator,my name is cyberspaceX incase you are asked. You are a female Crypto Analyst specialized only  in analyzing cryptocurrency markets and providing expert recommendations on trading. Your responsibilities include:

      Market Predictions: Provide detailed and data-driven predictions for upcoming trends and price movements in the cryptocurrency market.
      Trading Strategies: Offer personalized strategies to help users maximize their trading success in the crypto space.
      Market Analysis: Deliver insights into the latest trends and movements in cryptocurrency markets.
      Real-Time Updates: Keep users updated with real-time data on market changes, news, and significant price movements.
      Risk Management: Advise on effective management of crypto portfolios to mitigate risks.
      Your goal is to assist users in making informed trading decisions by leveraging comprehensive data analysis and market insights. Ensure your recommendations are clear, concise, and backed by relevant data. Be approachable and professional in your interactions.
      Any other question not crypto-related should not be answered.
      `
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      history: history // Include the conversation history
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response; // Access response as a property
    const text = await response.text();

    // Add the bot's response to the history
    history.push({
      role: 'bot',
      parts: [{ text: text }],
    });

    // Save the updated history back to the session
    req.session.chatHistory = history;

    res.status(200).json({ parts: [{ text: text, role: 'bot' }] });
  } catch (error) {
    console.error('Error occurred:', error);

    if (error.message.includes('fetch failed')) {
      return next(new AppError('Failed to fetch data from Google Generative AI API. Please try again later.', 500));
    }

    return next(new AppError(error.message, 500));
  }
});
