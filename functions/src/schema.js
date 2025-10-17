// JSON Schema for AI Canvas Command responses
const schema = {
  type: "object",
  required: ["action", "target", "parameters"],
  properties: {
    action: {
      type: "string",
      enum: ["create", "manipulate", "layout", "complex"]
    },
    target: {
      type: "string",
      enum: ["circle", "rectangle", "text", "triangle", "star", "arrow", "group", "form", "navbar", "card"]
    },
    parameters: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        radius: { type: "number" },
        rotation: { type: "number" },
        color: { type: "string" },
        text: { type: "string" },
        fontSize: { type: "number" },
        layout: { 
          type: "string",
          enum: ["grid", "row", "column"]
        },
        count: { type: "number" },
        gradientDirection: { 
          type: "string",
          enum: ["lighter", "darker", "both"]
        },
        gradientIntensity: { 
          type: "number", 
          minimum: 0.1, 
          maximum: 1.0 
        },
        selector: {
          type: "object",
          properties: {
            color: { type: "string" },
            shapeNumber: { type: "number" },
            shapeType: { type: "string" }
          }
        },
        sizeMultiplier: { type: "number" },
        relativeResize: { type: "boolean" },
        rotationDirection: { 
          type: "string",
          enum: ["right", "left", "flip", "clockwise", "counterclockwise"]
        },
        rotationDegrees: { type: "number" },
        relativeRotation: { type: "boolean" },
        positionAnchor: { 
          type: "string",
          enum: ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]
        },
        offsetX: { type: "number" },
        offsetY: { type: "number" },
        fields: {
          type: "array",
          items: { type: "string" }
        },
        items: {
          type: "array",
          items: { type: "string" }
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

module.exports = schema;
