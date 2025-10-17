const functions = require("firebase-functions");
const { OpenAI } = require("openai");
const Ajv = require("ajv");
const schema = require("./schema");

const ajv = new Ajv();
const validate = ajv.compile(schema);

// Initialize OpenAI (lazy initialization)
let client = null;

function getOpenAI() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

exports.aiCanvasCommand = functions.https.onCall(async (data, context) => {
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
