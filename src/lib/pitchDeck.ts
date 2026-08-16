import PptxGenJS from "pptxgenjs";
import type { Lead } from "@/generated/prisma/client";
import type { SiteSignals } from "@/lib/site-audit";
import type { MapsListingData } from "@/lib/maps-audit";

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

async function callClaudeForDeckContent(systemPrompt: string, userMessage: string): Promise<DeckContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

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
        system: systemPrompt,
        tools: [DECK_TOOL],
        tool_choice: { type: "tool", name: "submit_deck_content" },
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic deck generation error", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = (await res.json()) as { content?: { type: string; input?: unknown }[] };
    const toolBlock = data.content?.find(
      (block): block is { type: string; input: DeckContent } => block.type === "tool_use" && Boolean(block.input)
    );
    return toolBlock?.input ?? null;
  } catch (err) {
    console.error("Deck generation request failed", err);
    return null;
  }
}

export async function generateDeckContent(
  lead: Lead,
  signals: SiteSignals | null
): Promise<{ content: DeckContent; demo: boolean }> {
  const content = await callClaudeForDeckContent(SYSTEM_PROMPT, `Draft the deck from these facts:\n${factsFor(lead, signals)}`);
  return content ? { content, demo: false } : { content: demoDeckContent(lead, signals), demo: true };
}

const MAPS_SYSTEM_PROMPT = `You draft short local-marketing strategy proposals for Still Dreaming, a studio
that helps businesses fix their Google Maps / local search presence as part of a broader
website + automation + AI system.

You'll be given a business's real Google Maps listing data (or told it couldn't be found).
Draft a concrete, specific proposal outline focused on improving their Google Maps / local
search presence — reviews, rating, listing completeness, categories, photos.

Rules:
- Never invent facts (ratings, review counts, hours) beyond what you're given.
- Reference their real numbers directly (e.g. "27 reviews at 4.3 stars" rather than vague praise).
- If no listing was found at all, the first section should address that specifically — an
  unclaimed or unfindable listing is itself the most urgent finding.
- 3-4 sections, each with 2-4 short, concrete bullets (no fluff, no corporate-speak).
- End with a specific, low-friction next step (reply, short call), not a hard sell.
- Submit your output only via the submit_deck_content tool.`;

function mapsFactsFor(businessQuery: string, data: MapsListingData): string {
  if (!data.found) {
    return `Business searched: ${businessQuery}\nResult: no Google Maps listing could be found (${data.error || "no match"}).`;
  }

  return [
    `Business searched: ${businessQuery}`,
    `Listed name: ${data.name || "unknown"}`,
    `Address: ${data.address || "not listed"}`,
    `Phone listed: ${data.phone ? "yes" : "no"}`,
    `Website listed: ${data.website || "none"}`,
    `Rating: ${data.rating != null ? `${data.rating}/5` : "no rating yet"}`,
    `Review count: ${data.reviewCount ?? 0}`,
    `Categories: ${data.categories?.join(", ") || "none listed"}`,
    `Business status: ${data.businessStatus || "unknown"}`,
    `Hours listed: ${data.hasHours ? "yes" : "no"}`,
    `Photo count: ${data.photoCount ?? 0}`,
  ].join("\n");
}

function demoMapsProposal(businessQuery: string, data: MapsListingData): DeckContent {
  return {
    title: `Local presence for ${data.name || businessQuery}`,
    subtitle: "Demo mode: connect GOOGLE_PLACES_API_KEY and ANTHROPIC_API_KEY for a live-drafted version",
    sections: [
      {
        heading: "Where the listing stands",
        bullets: [
          data.found
            ? `${data.rating ?? "no"} rating across ${data.reviewCount ?? 0} reviews right now.`
            : "No listing found yet for this search — that's the first thing to fix.",
          data.website ? "Website is linked from the listing." : "No website linked from the listing.",
        ],
      },
      {
        heading: "Reviews & rating",
        bullets: ["A steady review-request flow after every job/sale", "Responding publicly to every review, good or bad"],
      },
      {
        heading: "Listing completeness",
        bullets: ["Hours, categories, and photos kept current", "Consistent name/address/phone across every directory"],
      },
    ],
    closingHeadline: "Next step",
    closingBullets: ["Reply or book a short call to walk through the fastest wins", "Scope is flexible — start with the piece that matters most"],
  };
}

export async function generateMapsProposal(
  businessQuery: string,
  data: MapsListingData
): Promise<{ content: DeckContent; demo: boolean }> {
  const content = await callClaudeForDeckContent(MAPS_SYSTEM_PROMPT, `Draft the proposal from these facts:\n${mapsFactsFor(businessQuery, data)}`);
  return content ? { content, demo: false } : { content: demoMapsProposal(businessQuery, data), demo: true };
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
