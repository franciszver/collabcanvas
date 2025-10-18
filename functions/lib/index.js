"use strict";
const functions = require("firebase-functions");
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
exports.aiCanvasCommand = functions
    .runWith({ secrets: ["OPENAI_API_KEY"] })
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    try {
        console.log('=== GEN 1 FUNCTION CALLED ===');
        console.log('Full data:', JSON.stringify(data));
        console.log('Type of data:', typeof data);
        console.log('Data keys:', Object.keys(data || {}));
        console.log('Context auth:', context.auth);
        console.log('Context auth uid:', (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
        // In Gen 1, data comes directly as the first parameter
        const { prompt } = data;
        console.log('Extracted prompt:', prompt);
        console.log('Prompt type:', typeof prompt);
        console.log('Prompt is truthy?', !!prompt);
        console.log('Prompt is string?', typeof prompt === 'string');
        if (!prompt || typeof prompt !== 'string') {
            console.error('VALIDATION FAILED!');
            console.error('Invalid prompt:', prompt);
            console.error('Type:', typeof prompt);
            console.error('Full data structure:', JSON.stringify(data, null, 2));
            throw new functions.https.HttpsError('invalid-argument', 'Prompt is required and must be a string');
        }
        console.log('Prompt validation PASSED!');
        // Check authentication
        const userId = (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid;
        if (!userId) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check rate limit
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return {
                error: 'Rate limit exceeded. Please wait a moment before sending another command.',
                details: 'You can send up to 5 AI commands every 10 seconds.'
            };
        }
        // Initialize OpenAI client with the secret
        console.log('Attempting to access OpenAI API key...');
        console.log('process.env.OPENAI_API_KEY exists?', !!process.env.OPENAI_API_KEY);
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('Got API key from env (length):', apiKey === null || apiKey === void 0 ? void 0 : apiKey.length);
        if (!apiKey) {
            throw new functions.https.HttpsError('internal', 'OPENAI_API_KEY is not configured');
        }
        const client = new OpenAI({
            apiKey: apiKey
        });
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
    "formType": string (form template type, optional),
    "fields": array of strings (for forms, optional),
    "items": array of strings (for navbars, optional)
  }
}

📝 FORM GENERATION (CRITICAL - FOLLOW EXACTLY):
- For ANY form request (login form, signup form, contact form, etc.):
  * MUST use action="complex" (NOT "create")
  * MUST use target="form"
  * MUST include formType in parameters
- Supported form types: "login", "signup", "contact"
- Forms are automatically laid out with proper spacing and styling

⚠️ WRONG: { "action": "create", "target": "form", ... }
✅ CORRECT: { "action": "complex", "target": "form", "parameters": { "formType": "login" } }

🔄 SHAPE MANIPULATION (ROTATION, MOVEMENT):
- To manipulate a shape, use action="manipulate"
- CRITICAL: When user specifies "#N" (like "#1", "#2"), ALWAYS include selector with shapeNumber and shapeType
- For "shape #N" format: Extract number after # and use as shapeNumber
- Rotation options:
  * rotation: absolute angle in degrees (0-360)
  * rotationDegrees + relativeRotation: true → rotate by X degrees from current angle
  * rotationDirection: "right" (90°), "left" (-90°), "flip" (180°)

Example valid responses:
"rotate rectangle #1 90 degrees" → {
  "action": "manipulate",
  "target": "rectangle",
  "parameters": {
    "selector": { "shapeNumber": 1, "shapeType": "rectangle" },
    "rotation": 90
  }
}

"rotate rectangle #1 to 90 degrees" → {
  "action": "manipulate",
  "target": "rectangle",
  "parameters": {
    "selector": { "shapeNumber": 1, "shapeType": "rectangle" },
    "rotation": 90
  }
}

"rotate circle #1 by 45 degrees" → {
  "action": "manipulate",
  "target": "circle",
  "parameters": {
    "selector": { "shapeNumber": 1, "shapeType": "circle" },
    "rotationDegrees": 45,
    "relativeRotation": true
  }
}

"move circle #2 to x:100 y:200" → {
  "action": "manipulate",
  "target": "circle",
  "parameters": {
    "selector": { "shapeNumber": 2, "shapeType": "circle" },
    "x": 100,
    "y": 200
  }
}

"flip circle #2" → {
  "action": "manipulate",
  "target": "circle",
  "parameters": {
    "selector": { "shapeNumber": 2, "shapeType": "circle" },
    "rotationDirection": "flip"
  }
}

"create a login form" → {
  "action": "complex",
  "target": "form",
  "parameters": {
    "formType": "login"
  }
}

"make a signup form" → {
  "action": "complex",
  "target": "form",
  "parameters": {
    "formType": "signup"
  }
}

"create a contact form" → {
  "action": "complex",
  "target": "form",
  "parameters": {
    "formType": "contact"
  }
}
`;
        const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 500,
            stream: false
        });
        const response = (_d = (_c = completion.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!response) {
            throw new functions.https.HttpsError('internal', 'No response from OpenAI');
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
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An error occurred processing your request');
    }
});
//# sourceMappingURL=index.js.map