/**
 * AI content rewriter — takes template HTML and rewrites it with
 * unique wording while preserving all factual content and structure.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { StoreConfig } from "../config/store-config.js";

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a professional copywriter specializing in e-commerce policy pages. Your job is to rewrite the provided HTML content so that it reads as unique, human-written text while keeping every piece of factual information intact.

Rules you MUST follow:
1. Return ONLY the rewritten HTML. Do not include markdown code fences, backticks, or any wrapper — just the raw HTML.
2. Keep ALL hyperlinks exactly as they appear (href values, mailto links, tel links, anchor text for links). Do not change any URL or link text.
3. Keep ALL email addresses, phone numbers, dates, times, fees, durations, and other factual data exactly as they appear.
4. Preserve the H2/H3 heading hierarchy and general HTML structure (lists stay as lists, paragraphs stay as paragraphs).
5. Change sentence structures, word choices, and phrasing throughout. Rearrange clauses, use synonyms, vary sentence length.
6. Keep all GMC (Google Merchant Center) compliance points intact — do not remove or weaken any consumer-protection language.
7. Maintain a professional, trustworthy, and approachable tone.
8. Vary your vocabulary — avoid repeating the same transition words or phrases.
9. Do not add new sections or remove existing ones.
10. Do not add any commentary, explanations, or notes outside the HTML.`;

/**
 * Rewrite template HTML with unique wording using Claude AI.
 *
 * The rewritten content preserves all factual information, links,
 * and HTML structure while varying sentence structure and vocabulary.
 */
export async function rewriteContent(
  originalHtml: string,
  pageType: string,
  config: StoreConfig,
): Promise<string> {
  const client = new Anthropic();

  const userPrompt = `Rewrite the following ${pageType} page HTML for the store "${config.storeName}" (operating in the ${config.brandNiche} niche). Make it sound natural and uniquely written while following all the rules in your instructions.

Here is the HTML to rewrite:

${originalHtml}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  // Extract the text content from the response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content in the response.");
  }

  return textBlock.text.trim();
}
