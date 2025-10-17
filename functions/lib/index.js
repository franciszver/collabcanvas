"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiCanvasCommand = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const openai_1 = require("openai");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// Initialize OpenAI (lazy initialization)
let openai = null;
function getOpenAI() {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openai = new openai_1.default({ apiKey });
    }
    return openai;
}
exports.aiCanvasCommand = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        const { prompt } = request.data;
        if (!prompt || typeof prompt !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'Prompt is required and must be a string');
        }
        // System prompt to restrict AI to JSON schema
        const systemPrompt = `You are an AI Canvas Agent integrated into a collaborative drawing application. 
Your ONLY purpose is to translate natural language user commands into JSON objects 
that describe canvas actions. 

⚠️ Rules:
- Always respond ONLY with valid JSON.
- Never include explanations, free text, or commentary.
- The JSON must strictly follow the schema below.
- If the user asks for anything unrelated to canvas actions, respond with:
  { "error": "Unsupported command. Only canvas-related actions are allowed." }

📐 JSON Schema:
{
  "action": "create" | "manipulate" | "layout" | "complex",
  "target": "circle" | "rectangle" | "text" | "group" | "form" | "navbar" | "card",
  "parameters": {
    "x": number (optional),
    "y": number (optional),
    "width": number (optional),
    "height": number (optional),
    "radius": number (optional),
    "rotation": number (degrees, optional),
    "color": string (CSS color, optional),
    "text": string (for text shapes, optional),
    "layout": string ("grid" | "row" | "column", optional),
    "count": number (for repeated elements, optional),
    "fields": array of strings (for forms, optional),
    "items": array of strings (for navbars, optional)
  }
}`;
        const openaiClient = getOpenAI();
        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500,
            stream: false // Keep non-streaming for now, can be enhanced later
        });
        const response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!response) {
            throw new https_1.HttpsError('internal', 'No response from OpenAI');
        }
        // Try to parse the response as JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(response);
        }
        catch (parseError) {
            console.error('Failed to parse OpenAI response as JSON:', response);
            return { error: 'Invalid response format from AI' };
        }
        // Check if it's an error response
        if ('error' in parsedResponse) {
            return parsedResponse;
        }
        // Validate the action structure
        if (!parsedResponse.action) {
            return { error: 'Invalid action structure' };
        }
        return parsedResponse;
    }
    catch (error) {
        console.error('Error in aiCanvasCommand:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'An error occurred processing your request');
    }
});
//# sourceMappingURL=index.js.map