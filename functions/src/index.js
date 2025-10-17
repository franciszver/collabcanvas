const functions = require("firebase-functions");
const { OpenAI } = require("openai");
const Ajv = require("ajv");
const schema = require("./schema");

const ajv = new Ajv();
const validate = ajv.compile(schema);

exports.aiCanvasCommand = functions
  .runWith({ secrets: ["OPENAI_API_KEY"] })
  .https.onCall(async (data, context) => {
  try {
    const { prompt } = data;

    if (!prompt || typeof prompt !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt is required and must be a string');
    }

    // System prompt to restrict AI to JSON schema
    const systemPrompt = `You are an AI Canvas Agent integrated into a collaborative drawing application. 
Your ONLY purpose is to translate natural language user commands into JSON objects 
that describe canvas actions. 

⚠️ Rules:
- Always respond ONLY with valid JSON.
- Never include explanations, free text, or commentary.
- The JSON must strictly follow the schema below.
- REQUIRED fields: action, target, parameters (all must be present)
- If the user asks for anything unrelated to canvas actions, respond with:
  { "error": "Unsupported command. Only canvas-related actions are allowed." }

📐 JSON Schema (EXACT FORMAT REQUIRED):
{
  "action": "create" | "manipulate" | "layout" | "complex",
  "target": "circle" | "rectangle" | "text" | "triangle" | "star" | "arrow" | "group" | "form" | "navbar" | "card",
  "parameters": {
    "x": number (optional),
    "y": number (optional),
    "width": number (optional, 10-1920px),
    "height": number (optional, 10-1080px),
    "radius": number (optional, 5-960px),
    "rotation": number (optional, 0-360 degrees),
    "color": string (optional, hex color or name),
    "text": string (optional),
    "fontSize": number (optional, 8-72px),
    "layout": "grid" | "row" | "column" (optional),
    "count": number (optional),
    "fields": [string] (optional),
    "items": [string] (optional)
  }
}

📏 SIZE CONSTRAINTS:
- width/height: 10px minimum, viewport size maximum
- radius: 5px minimum, half viewport size maximum  
- fontSize: 8px minimum, 72px maximum
- All dimensions are in pixels

Example valid responses:
"create a circle" → {
  "action": "create",
  "target": "circle",
  "parameters": {
    "radius": 50
  }
}

"make a 200x300 rectangle" → {
  "action": "create",
  "target": "rectangle",
  "parameters": {
    "width": 200,
    "height": 300
  }
}

"create text with 24px font" → {
  "action": "create",
  "target": "text",
  "parameters": {
    "text": "Enter Text",
    "fontSize": 24
  }
}`;

    // Initialize OpenAI client with the secret
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'OPENAI_API_KEY is not configured');
    }
    
    const openaiClient = new OpenAI({ apiKey });
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
      stream: false
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new functions.https.HttpsError('internal', 'No response from OpenAI');
    }

    // Try to parse the response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
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

  } catch (error) {
    console.error('Error in aiCanvasCommand:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'An error occurred processing your request');
  }
});
