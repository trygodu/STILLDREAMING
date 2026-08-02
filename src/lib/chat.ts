export const CHAT_SYSTEM_PROMPT = `You are the AI concierge embedded on the Still Dreaming website (trygodu.com) — a
site that is itself a demonstration of what its builder, Claude, can ship: the
marketing site, this chatbot, the lead-tracking system behind it, and the
funnels that feed it.

Your job:
- Answer questions about the kind of work this represents: websites, automated
  prospect/lead tracking systems, AI chatbots like yourself, and marketing
  funnels — all built and wired together as one working system.
- Be concise, warm, and concrete. Prefer 2-4 sentences over long essays.
- When a visitor shows real interest (asks about pricing, timelines, or says
  they want to build something), ask for their email so a human can follow up,
  and let them know their info will be captured automatically — that IS the
  system working.
- Never invent case studies, client names, or numbers that weren't given to
  you. If you don't know something concrete, say so plainly and offer to
  connect them with a human instead.
- You are not a general-purpose assistant — steer unrelated questions back to
  what this site/system can do for the visitor.`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  reply: string;
  demo: boolean;
}

export async function getAssistantReply(history: ChatTurn[]): Promise<AssistantReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { reply: demoReply(history), demo: true };
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || DEFAULT_MODEL,
        max_tokens: 400,
        system: CHAT_SYSTEM_PROMPT,
        messages: history.map((turn) => ({ role: turn.role, content: turn.content })),
      }),
    });

    if (!res.ok) {
      console.error("Anthropic API error", res.status, await res.text().catch(() => ""));
      return { reply: demoReply(history), demo: true };
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((block) => block.type === "text")?.text;
    return { reply: text?.trim() || demoReply(history), demo: false };
  } catch (err) {
    console.error("Anthropic API request failed", err);
    return { reply: demoReply(history), demo: true };
  }
}

/**
 * Deterministic, clearly-labeled fallback so the widget still demonstrates
 * the lead-capture flow end-to-end when no ANTHROPIC_API_KEY is configured.
 */
function demoReply(history: ChatTurn[]): string {
  const lastUser = [...history].reverse().find((t) => t.role === "user")?.content.toLowerCase() ?? "";

  const intro = "*(Demo mode — connect ANTHROPIC_API_KEY for live Claude responses.)*\n\n";

  if (/price|cost|budget|quote/.test(lastUser)) {
    return (
      intro +
      "Pricing depends on scope, but every engagement bundles the same four pieces you're looking at right now: the site, the lead-tracking system, the chatbot, and the funnels. Share your email and a line about your project, and a human will follow up with specifics."
    );
  }

  if (/chatbot|ai|claude/.test(lastUser)) {
    return (
      intro +
      "This chatbot is a working example — it's a Next.js API route that calls Claude directly, falls back gracefully without a key, and can hand qualified conversations off as tracked leads. The same pattern can be dropped into your product or site."
    );
  }

  if (/hello|hi|hey/.test(lastUser)) {
    return (
      intro +
      "Hey! This site doubles as a live demo: the page you're on, this chat, and the lead capture behind it were all built the same way — with Claude. What are you hoping to build?"
    );
  }

  if (/email|contact|follow up|call/.test(lastUser)) {
    return (
      intro +
      "Drop your email here and I'll log it as a lead right now — you can watch it happen, that's the whole point of this system. A human will reach out after."
    );
  }

  return (
    intro +
    "This site is proof-of-work: a marketing site, an automated lead-tracking system, this chatbot, and the funnels connecting them, all built with Claude. Ask me about any piece of it, or share your email if you'd like a human to follow up."
  );
}

export function extractEmail(text: string): string | null {
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (!match) return null;
  // Strip trailing punctuation the regex greedily swept up (e.g. "me@x.com,").
  return match[0].replace(/[.,;:!?)\]]+$/, "");
}
