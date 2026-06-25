import { verifyUser } from "@/lib/verifyUser";
import { webSearch } from "@/lib/webSearch";

const SYSTEM_PROMPTS = {
  chat: "You are a helpful, accurate assistant. Keep responses concise and conversational unless the user asks for more depth.",
  research: "You are a research assistant. Give a clear, concise summary first. Only go in-depth or list extensive sources if the user asks for more detail.",
  math: "You are a math problem solver. Explain your solution like you're talking a friend through it on paper — natural sentences, not headers or rigid 'Step 1/Step 2' formatting unless the problem genuinely has distinct stages worth separating. Do NOT use LaTeX or backslash math commands (no \\frac, \\sqrt, \\[, $, etc) — write math inline using normal characters: ^ for exponents, / for fractions, √ or sqrt() for roots, ± for plus-minus. Keep it concise and conversational, then clearly state the final answer at the end.",
  schedule: 'You help the user plan and describe schedules in plain text. Be concise. When the user asks to add, schedule, or create a specific calendar event or meeting with a clear title, date, and time, respond with a short confirmation sentence, then a fenced code block using the language tag calendar-event containing ONLY valid JSON with exactly these fields: {"title": string, "startDateTime": ISO 8601 datetime string, "endDateTime": ISO 8601 datetime string}. Example: ```calendar-event\n{"title": "Team meeting", "startDateTime": "2026-06-26T15:00:00", "endDateTime": "2026-06-26T16:00:00"}\n```. Only include this block for a specific, concrete event the user wants added — not for general planning advice, agendas, or tips.',
  meeting: "You summarize meeting notes into clear, short action items and key points.",
  design: "You help structure presentation slides and design content. Keep suggestions brief and scannable — a short outline, not a full script, unless asked for more.",
  website: "You help plan and write code for websites. Keep explanations short; let code speak for itself.",
  seo: "You give concrete, actionable SEO recommendations. Default to a short, prioritized list of 3-5 actions, not an exhaustive checklist, unless the user asks for more.",
};

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "openai/gpt-oss-120b";

const TEXT_BUDGET = 8000; // total chars of extracted file text we'll send to the model

function buildFileTextBlock(files) {
  const nonImageFiles = (files || []).filter((f) => !f.mimeType?.startsWith("image/"));
  if (nonImageFiles.length === 0) return "";

  const perFileBudget = Math.max(500, Math.floor(TEXT_BUDGET / nonImageFiles.length));
  return nonImageFiles
    .map((f) => {
      if (f.extractedText) {
        return `\n\n[Content from attached file "${f.name}"]:\n${f.extractedText.slice(0, perFileBudget)}`;
      }
      return `\n\n[Attached file: ${f.name} — could not extract readable content]`;
    })
    .join("");
}

function toGroqMessages(messages, systemPrompt) {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => {
      const imageFiles = (m.files || []).filter((f) => f.mimeType?.startsWith("image/"));
      const fileTextBlock = buildFileTextBlock(m.files);
      const textContent = `${m.content || ""}${fileTextBlock}`.trim();
      const role = m.role === "assistant" ? "assistant" : "user";

      if (imageFiles.length > 0) {
        return {
          role,
          content: [
            { type: "text", text: textContent || "Describe these images." },
            ...imageFiles.map((f) => ({ type: "image_url", image_url: { url: f.dataUrl } })),
          ],
        };
      }
      return { role, content: textContent || m.content };
    }),
  ];
}

const LENGTH_MODIFIERS = {
  concise: "IMPORTANT: Regardless of previous answers in this conversation, respond in 2-4 sentences maximum or a very short list. Do not use tables or multiple sections. Be direct.",
  balanced: "Give a clear, moderately detailed response — enough to be useful without being exhaustive. A few short sections or a small table is fine if helpful.",
  detailed: "IMPORTANT: Regardless of previous answers in this conversation, give a thorough, comprehensive response. Use multiple sections, tables, and examples. Go deeper than you normally would.",
};

const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the live web for current information — news, prices, recent events, or any fact that may have changed since training. Use this whenever the answer depends on up-to-date or real-time information.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
      },
      required: ["query"],
    },
  },
};

const MAX_TOOL_ITERATIONS = 3;

async function callGroq(apiKey, model, groqMessages, useTools) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: groqMessages,
      ...(useTools ? { tools: [WEB_SEARCH_TOOL], tool_choice: "auto" } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }
  return data.choices?.[0]?.message;
}

function stripLatex(text) {
  if (!text) return text;
  let plain = text;
  // Remove $$...$$ and $...$ delimiters, keep the content inside
  plain = plain.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => expr.trim());
  plain = plain.replace(/\$([^\$\n]+?)\$/g, (_, expr) => expr.trim());
  // Remove \[ \] and \( \) delimiters, keep the content inside
  plain = plain.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => expr.trim());
  plain = plain.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => expr.trim());
  // Convert common LaTeX commands to plain text equivalents
  plain = plain.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  plain = plain.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  plain = plain.replace(/\\dfrac/g, "");
  plain = plain.replace(/\\boxed\{([^{}]+)\}/g, "$1");
  plain = plain.replace(/\\pm/g, "±");
  plain = plain.replace(/\\times/g, "×");
  plain = plain.replace(/\\cdot/g, "·");
  plain = plain.replace(/\\text\{([^{}]+)\}/g, "$1");
  return plain;
}

export async function POST(req) {
  const user = await verifyUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, tool, length } = await req.json();
  const apiKey = process.env.GROQ_API_KEY;
  const basePrompt = SYSTEM_PROMPTS[tool] || SYSTEM_PROMPTS.chat;
  const identityPrompt =
    "You are the AI assistant inside EmGlodAi, an all-in-one AI tool hub. You are not ChatGPT, ChatGPT-4, or any OpenAI product, and you should never say that you are. If asked who you are, say you're the EmGlodAi assistant.";
  const lengthInstruction = LENGTH_MODIFIERS[length] || LENGTH_MODIFIERS.balanced;
  const systemPrompt = `${identityPrompt} ${basePrompt} ${lengthInstruction}`;

  const hasImage = messages.some((m) => (m.files || []).some((f) => f.mimeType?.startsWith("image/")));
  const model = hasImage ? VISION_MODEL : TEXT_MODEL;

  const useTools = !hasImage && Boolean(process.env.TAVILY_API_KEY);
  const toolsNote = useTools
    ? " You have a web_search tool available — use it whenever the question depends on current or real-time information you wouldn't otherwise know."
    : "";
  const finalSystemPrompt = `${systemPrompt}${toolsNote}`;

  try {
    let groqMessages = toGroqMessages(messages, finalSystemPrompt);
    let assistantMessage = await callGroq(apiKey, model, groqMessages, useTools);

    let iterations = 0;
    while (assistantMessage?.tool_calls?.length && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      groqMessages = [...groqMessages, assistantMessage];

      for (const toolCall of assistantMessage.tool_calls) {
        let resultContent;
        try {
          const args = JSON.parse(toolCall.function.arguments || "{}");
          const results = await webSearch(args.query);
          resultContent = JSON.stringify(results);
        } catch (err) {
          resultContent = `Search failed: ${err.message}`;
        }
        groqMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: resultContent,
        });
      }

      assistantMessage = await callGroq(apiKey, model, groqMessages, useTools);
    }

    const text = stripLatex(assistantMessage?.content) || "No response.";
return Response.json({ text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}