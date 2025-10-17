"use strict";
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const Ajv = require("ajv");
const schema = require("./schema");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const ajv = new Ajv();
const validate = ajv.compile(schema);
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 5;
// Force restart to pick up environment variables
async function checkRateLimit(userId) {
    const rateLimitRef = admin.firestore().collection('rateLimits').doc(userId);
    const now = Date.now();
    try {
        const doc = await rateLimitRef.get();
        if (!doc.exists) {
            // First request from this user
            await rateLimitRef.set({
                count: 1,
                windowStart: now,
                expiresAt: now + RATE_LIMIT_WINDOW_MS
            });
            return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
        }
        const data = doc.data();
        const windowStart = (data === null || data === void 0 ? void 0 : data.windowStart) || 0;
        const count = (data === null || data === void 0 ? void 0 : data.count) || 0;
        // Check if we're in a new window
        if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
            // Reset the window
            await rateLimitRef.set({
                count: 1,
                windowStart: now,
                expiresAt: now + RATE_LIMIT_WINDOW_MS
            });
            return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
        }
        // Check if limit exceeded
        if (count >= RATE_LIMIT_MAX_REQUESTS) {
            return { allowed: false, remaining: 0 };
        }
        // Increment count
        await rateLimitRef.update({
            count: count + 1
        });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - count - 1 };
    }
    catch (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow request if rate limit check fails
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
    }
}
exports.aiCanvasCommand = onCall(async (request) => {
    var _a, _b;
    try {
        console.log('Received request:', JSON.stringify(request));
        console.log('Request data:', JSON.stringify(request.data));
        // In v2 callable functions, data is directly on request.data
        const { prompt } = request.data || {};
        const auth = request.auth;
        if (!prompt || typeof prompt !== 'string') {
            console.error('Invalid prompt:', prompt, 'Type:', typeof prompt);
            console.error('Full request.data:', request.data);
            throw new Error('Prompt is required and must be a string');
        }
        // Check authentication
        const userId = auth === null || auth === void 0 ? void 0 : auth.uid;
        if (!userId) {
            throw new Error('User must be authenticated');
        }
        // Check rate limit
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return {
                error: 'Rate limit exceeded. Please wait a moment before sending another command.',
                details: 'You can send up to 5 AI commands every 10 seconds.'
            };
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
    "count": number (for repeated elements or layout, optional, max 20),
    "spacing": number (gap between shapes in pixels, optional, default 20),
    "rows": number (grid rows, optional, auto-calculated if not provided),
    "cols": number (grid columns, optional, auto-calculated if not provided),
    "fields": array of strings (for forms, optional),
    "items": array of strings (for navbars, optional)
  }
}`;
        const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500,
            stream: false
        });
        const response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!response) {
            throw new Error('No response from OpenAI');
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
        if (parsedResponse.error) {
            return parsedResponse;
        }
        // Validate against JSON schema using AJV
        const isValid = validate(parsedResponse);
        if (!isValid) {
            console.error('Schema validation failed:', validate.errors);
            return { error: 'Response does not match required schema' };
        }
        return parsedResponse;
    }
    catch (error) {
        console.error('Error in aiCanvasCommand:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map