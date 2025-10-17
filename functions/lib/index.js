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
        const systemPrompt = `You are an AI assistant for a collaborative canvas application. 
    You can only respond with JSON objects that match the canvas action schema.
    
    Available actions:
    - create: Create shapes (circle, rectangle, text, arrow, star, triangle)
    - manipulate: Move, resize, rotate existing shapes
    - layout: Arrange shapes in rows, columns, or grids
    - complex: Create complex UI elements (forms, navbars, cards)
    
    Required fields for create:
    - action: "create"
    - shapeType: one of the available shape types
    - x, y: position coordinates
    - width, height: dimensions (or radius for circles)
    - fill: color (hex code)
    - text: text content (for text shapes)
    - fontSize: font size (for text shapes)
    
    If the user's request is unrelated to canvas operations, respond with:
    {"error": "Unsupported command"}
    
    Always respond with valid JSON only.`;
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