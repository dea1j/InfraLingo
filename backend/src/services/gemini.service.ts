import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export class GeminiService {
    static async generateInfrastructure(prompt: string) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
        You are an elite Cloud Solutions Architect. Your job is to convert the user's natural language request into a valid cloud infrastructure design.
        
        You MUST return your response as a strictly valid, parsable JSON object. Do not include any conversational filler. 
        Do not wrap the JSON in markdown code blocks like \`\`\`json. Just return the raw JSON string.

        The JSON object must have exactly this structure:
        {
            "nodes": [
                { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "AWS VPC" }, "type": "default" },
                { "id": "2", "position": { "x": 0, "y": 100 }, "data": { "label": "EC2 Instance" }, "type": "default" }
            ],
            "edges": [
                { "id": "e1-2", "source": "1", "target": "2", "animated": true }
            ],
            "code": "Valid Terraform HCL code here...",
            "docs": "# Architectural README\\n\\nDetailed english documentation here including a security warning and deployment steps."
        }

        Rules for the JSON payload:
        1. 'nodes': Array of objects formatted exactly for React Flow. Space them out visually using the x and y coordinates.
        2. 'edges': Array of objects formatted for React Flow connecting the nodes.
        3. 'code': Strictly valid Terraform code matching the requested architecture.
        4. 'docs': A detailed Markdown string explaining the architecture, the "Why", security warnings, and how to run the Terraform. MUST BE IN ENGLISH.
        `;

        try {
            const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
            const responseText = result.response.text();

            const cleanJsonString = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

            return JSON.parse(cleanJsonString);

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw new Error("Failed to generate infrastructure from AI.");
        }
    }
}