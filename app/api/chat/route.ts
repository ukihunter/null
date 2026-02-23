import { type NextRequest, NextResponse } from "next/server";

// Configuration
const AI_REQUEST_TIMEOUT = 180000; // 180 seconds timeout for AI requests
const MAX_MESSAGE_LENGTH = 3000; // Max characters per message
const MAX_HISTORY_MESSAGES = 5; // Max history messages to include
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Configure Next.js API route for longer execution time
export const maxDuration = 180; // Allow up to 180 seconds for this route

type AIProvider = "ollama" | "gemini";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface EnhancePromptRequest {
  prompt: string;
  context?: {
    fileName?: string;
    language?: string;
    codeContent?: string;
  };
}

async function generateWithGemini(
  messages: ChatMessage[],
  model: string = "gemini-2.5-flash",
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.",
    );
  }

  const systemPrompt = `You are a coding assistant. Help with code, debugging, and best practices. Keep responses concise and practical.`;

  // Format messages for Gemini API
  const formattedMessages = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Add system prompt as first user message if needed
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    {
      role: "model",
      parts: [{ text: "I understand. I'll help you with coding tasks." }],
    },
    ...formattedMessages,
  ];

  try {
    // Use the model name directly for v1beta API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini API");
    }

    return text.trim();
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
}

async function generateWithOllama(
  messages: ChatMessage[],
  model: string,
): Promise<string> {
  const systemPrompt = `You are a coding assistant. Help with code, debugging, and best practices. Keep responses concise.`;

  // Truncate long messages to speed up processing
  const truncatedMessages = messages.map((msg) => ({
    ...msg,
    content:
      msg.content.length > MAX_MESSAGE_LENGTH
        ? msg.content.substring(0, MAX_MESSAGE_LENGTH) + "..."
        : msg.content,
  }));

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...truncatedMessages,
  ];

  const prompt = fullMessages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT);

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 300,
          repeat_penalty: 1.1,
          num_ctx: 2048,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Ollama API:", errorText);

      // Check if model not found
      if (response.status === 404 && errorText.includes("not found")) {
        throw new Error(
          `Model '${model}' is not installed. Install it with: ollama pull ${model}\n\nOr switch to Gemini for instant responses without installation.`,
        );
      }

      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error("No response from Ollama");
    }
    return data.response.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      console.error(
        "Ollama request timed out after",
        AI_REQUEST_TIMEOUT / 1000,
        "seconds",
      );
      throw new Error(
        `Request timeout: Ollama took longer than ${AI_REQUEST_TIMEOUT / 1000} seconds to respond. Try a smaller model or use Gemini.`,
      );
    }
    console.error("Ollama generation error:", error);
    throw error;
  }
}

async function generateAIResponse(
  messages: ChatMessage[],
  provider: AIProvider = "gemini",
  model: string = "gemini-2.5-flash",
): Promise<{ response: string; model: string }> {
  let response: string;
  let usedModel: string;

  if (provider === "gemini") {
    response = await generateWithGemini(messages, model);
    usedModel =
      model === "gemini-2.5-flash"
        ? "Gemini 2.5 Flash"
        : model === "gemini-2.5-pro"
          ? "Gemini 2.5 Pro"
          : model === "gemini-pro"
            ? "Gemini Pro"
            : "Gemini Flash";
  } else {
    response = await generateWithOllama(messages, model);
    usedModel = model;
  }

  return { response, model: usedModel };
}

async function enhancePrompt(request: EnhancePromptRequest) {
  const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

Original prompt: "${request.prompt}"

Context: ${request.context ? JSON.stringify(request.context, null, 2) : "No additional context"}

Enhanced prompt should:
- Be more specific and detailed
- Include relevant technical context
- Ask for specific examples or explanations
- Be clear about expected output format
- Maintain the original intent

Return only the enhanced prompt, nothing else.`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-coder:1.3b", // Match the main chat model
        prompt: enhancementPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 300,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to enhance prompt");
    }

    const data = await response.json();
    return data.response?.trim() || request.prompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return request.prompt; // Return original if enhancement fails
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle prompt enhancement
    if (body.action === "enhance") {
      const enhancedPrompt = await enhancePrompt(body as EnhancePromptRequest);
      return NextResponse.json({ enhancedPrompt });
    }

    // Handle regular chat
    const {
      message,
      history,
      provider = "gemini",
      model = "gemini-2.5-flash",
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg: unknown): msg is ChatMessage =>
            typeof msg === "object" &&
            msg !== null &&
            typeof (msg as ChatMessage).role === "string" &&
            typeof (msg as ChatMessage).content === "string" &&
            ["user", "assistant"].includes((msg as ChatMessage).role),
        )
      : [];

    // Limit to fewer messages for faster processing
    const recentHistory = validHistory.slice(-MAX_HISTORY_MESSAGES);
    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const result = await generateAIResponse(
      messages,
      provider as AIProvider,
      model,
    );

    if (!result.response) {
      throw new Error("Empty response from AI model");
    }

    return NextResponse.json({
      response: result.response,
      model: result.model,
      provider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in AI chat route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Chat API is running",
    timestamp: new Date().toISOString(),
    providers: {
      gemini: {
        available: !!GEMINI_API_KEY,
        models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-pro"],
        description: "Fast, free Google AI - Recommended",
      },
      ollama: {
        available: true,
        models: ["codellama:7b", "llama2:7b", "deepseek-coder:1.3b"],
        description: "Local AI models (install via ollama pull)",
      },
    },
    info: "Use POST method to send chat messages with provider and model selection",
  });
}
