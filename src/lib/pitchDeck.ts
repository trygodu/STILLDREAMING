import PptxGenJS from "pptxgenjs";
import type { Lead } from "@/generated/prisma/client";
import type { SiteSignals } from "@/lib/site-audit";

const JADE = "00A86B";
const INK = "0A0A0A";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

export interface DeckSection {
  heading: string;
  bullets: string[];
}

export interface DeckContent {
  title: string;
  subtitle: string;
  sections: DeckSection[];
  closingHeadline: string;
  closingBullets: string[];
}

const SYSTEM_PROMPT = `You draft short sales-proposal deck outlines for Still Dreaming, a studio that
builds websites + automated lead-tracking systems + AI chatbots + funnels as one connected system.

You'll be given facts about one specific lead who engaged with the site (their message, company,
website, and — if their site could be reached — a few real signals about it). Draft a concise,
concrete proposal outline addressed to them specifically.

Rules:
- Never invent facts. If no website was given or it couldn't be reached, do not describe their site —
  pivot to a generic value framing tied to what they actually said.
- Reference their own words/company/site where you genuinely have them; don't pad with generic filler.
- 3-4 sections, each with 2-4 short, concrete bullets (no fluff, no corporate-speak).
- End with a specific, low-friction next step (reply, short call), not a hard sell.
- Submit your output only via the submit_deck_content tool.`;

const DECK_TOOL = {
  name: "submit_deck_content",
  description: "Submit the structured content for the pitch deck.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      subtitle: { type: "string" as const },
      sections: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            heading: { type: "string" as const },
            bullets: { type: "array" as const, items: { type: "string" as const } },
          },
          required: ["heading", "bullets"],
        },
      },
      closingHeadline: { type: "string" as const },
      closingBullets: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title", "subtitle", "sections", "closingHeadline", "closingBullets"],
  },
};

function factsFor(lead: Lead, signals: SiteSignals | null): string {
  const lines = [
    `Name: ${lead.name || "unknown"}`,
    `Company: ${lead.company || "unknown"}`,
    `Email: ${lead.email}`,
    `How they came in: ${lead.source.replace(/_/g, " ").toLowerCase()}`,
    `Their message: ${lead.message || "(none given)"}`,
  ];

  if (!lead.website) {
    lines.push("Website: not provided.");
  } else if (signals?.ok) {
    lines.push(
      `Website: ${lead.website}`,
      `Site signals — title: "${signals.title || "n/a"}", description: "${signals.description || "n/a"}", ` +
        `mobile-friendly (viewport tag present): ${signals.hasViewportMeta}, HTTPS: ${signals.hasHttps}, ` +
        `responded in ${signals.loadTimeMs}ms with HTTP ${signals.status}.`
    );
  } else {
    lines.push(`Website: ${lead.website} (could not be inspected automatically — do not describe it).`);
  }

  return lines.join("\n");
}

function demoDeckContent(lead: Lead, signals: SiteSignals | null): DeckContent {
  const name = lead.name || "there";
  const company = lead.company || "your team";

  const siteBullet = !lead.website
    ? "No website was provided yet — this proposal covers the general framework."
    : signals?.ok
      ? `${lead.website} responded in ${signals.loadTimeMs}ms and ${signals.hasViewportMeta ? "is" : "isn't"} tagged mobile-friendly.`
      : `${lead.website} was provided but couldn't be inspected automatically.`;

  return {
    title: `A system for ${company}`,
    subtitle: `Prepared for ${name} — demo mode: connect ANTHROPIC_API_KEY for a live-drafted version`,
    sections: [
      {
        heading: "Where things stand",
        bullets: [
          siteBullet,
          lead.message ? `You told us: "${lead.message.slice(0, 140)}"` : "No specific brief yet — happy to scope on a short call.",
        ],
      },
      {
        heading: "The website",
        bullets: ["A fast, modern site built for the goal it actually serves", "Analytics and attribution wired in from day one"],
      },
      {
        heading: "The automated system",
        bullets: ["Every visitor and lead captured, scored, and logged automatically", "A dashboard to run the pipeline instead of a spreadsheet"],
      },
      {
        heading: "AI + funnels",
        bullets: ["A chatbot that qualifies visitors and captures leads while it talks", "Lead-magnet funnels engineered to convert traffic into tracked prospects"],
      },
    ],
    closingHeadline: "Next step",
    closingBullets: [`Reply to ${lead.email} or book a short call`, "Scope is flexible — start with the piece that matters most"],
  };
}

export async function generateDeckContent(
  lead: Lead,
  signals: SiteSignals | null
): Promise<{ content: DeckContent; demo: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { content: demoDeckContent(lead, signals), demo: true };
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
        model: process.env.DECK_MODEL || DEFAULT_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: [DECK_TOOL],
        tool_choice: { type: "tool", name: "submit_deck_content" },
        messages: [{ role: "user", content: `Draft the deck from these facts:\n${factsFor(lead, signals)}` }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic deck generation error", res.status, await res.text().catch(() => ""));
      return { content: demoDeckContent(lead, signals), demo: true };
    }

    const data = (await res.json()) as { content?: { type: string; input?: unknown }[] };
    const toolBlock = data.content?.find(
      (block): block is { type: string; input: DeckContent } => block.type === "tool_use" && Boolean(block.input)
    );
    if (!toolBlock) return { content: demoDeckContent(lead, signals), demo: true };

    return { content: toolBlock.input, demo: false };
  } catch (err) {
    console.error("Deck generation request failed", err);
    return { content: demoDeckContent(lead, signals), demo: true };
  }
}

function bulletList(bullets: string[]) {
  return bullets.map((text) => ({ text, options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } }));
}

export async function buildDeckBuffer(content: DeckContent): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "SD", width: 10, height: 5.63 });
  pptx.layout = "SD";

  const title = pptx.addSlide();
  title.background = { color: INK };
  title.addText("STILL DREAMING", { x: 0.5, y: 0.4, fontSize: 12, color: JADE, bold: true, charSpacing: 2 });
  title.addText(content.title, { x: 0.5, y: 1.6, w: 9, fontSize: 34, color: "FFFFFF", bold: true });
  title.addText(content.subtitle, { x: 0.5, y: 3.1, w: 9, fontSize: 14, color: "AAAAAA" });

  for (const section of content.sections) {
    const slide = pptx.addSlide();
    slide.background = { color: INK };
    slide.addText(section.heading, { x: 0.5, y: 0.4, w: 9, fontSize: 24, color: JADE, bold: true });
    slide.addText(bulletList(section.bullets), {
      x: 0.5,
      y: 1.3,
      w: 9,
      h: 3.8,
      fontSize: 16,
      color: "FFFFFF",
      valign: "top",
    });
  }

  const closing = pptx.addSlide();
  closing.background = { color: JADE };
  closing.addText(content.closingHeadline, { x: 0.5, y: 1.1, w: 9, fontSize: 30, color: INK, bold: true });
  closing.addText(bulletList(content.closingBullets), {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 2.5,
    fontSize: 16,
    color: INK,
    valign: "top",
  });

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}
