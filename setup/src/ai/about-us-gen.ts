/**
 * AI-powered About Us page generator.
 *
 * Uses Claude to write a completely unique, human-sounding brand story
 * tailored to the store's niche and identity.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { StoreConfig } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a seasoned brand storyteller who writes About Us pages for e-commerce stores. Your writing should feel genuinely human — warm, specific, and authentic. You write copy that scores 90%+ on AI detection tools because it sounds like a real person wrote it.

Rules you MUST follow:
1. Output clean HTML only — no markdown fences, backticks, or wrappers. Just raw HTML.
2. Use H2 tags for section headings and <p> tags for paragraphs.
3. Write in a warm, conversational tone with varied sentence lengths.
4. Include personal touches and specific details that make the brand feel real.
5. AVOID these AI cliches at all costs:
   - "In today's world" / "In today's fast-paced world"
   - "We believe" (as a sentence opener)
   - "Our journey" / "Our story began"
   - "passionate about" / "passion for"
   - "At the heart of" / "At its core"
   - "We strive" / "We are committed to"
   - "Look no further"
   - "Elevate your" / "Transform your"
   - "Curated" / "Seamless" / "Cutting-edge"
   - "Whether you're ... or ..." constructions
6. Use varied sentence openings — do not start multiple sentences the same way.
7. Mix short punchy sentences with longer descriptive ones.
8. DO NOT include any contact information — that will be appended separately.
9. Aim for 400-600 words.
10. Do not add any commentary, explanations, or notes outside the HTML.`;

/**
 * Generate a unique About Us page using Claude AI.
 *
 * The generated content is a complete brand story tailored to the store's
 * niche. Contact information is appended automatically at the end.
 */
export async function generateAboutUs(
  config: StoreConfig,
): Promise<string> {
  const client = new Anthropic();

  const userPrompt = `Write an About Us page for the following e-commerce store:

- Store Name: ${config.storeName}
- Business Entity: ${config.businessEntityName}
- Niche/Industry: ${config.brandNiche}
- Location: ${config.businessAddress.city}, ${config.businessAddress.state}, ${config.businessAddress.country}

Create a compelling brand story that:
- Introduces "${config.storeName}" and what the store offers in the ${config.brandNiche} space
- Naturally mentions the business entity "${config.businessEntityName}" (e.g., as the company behind the brand)
- Covers the brand's mission and what drives the team
- Talks about quality standards and how products are selected or sourced
- Shares the brand's values and what sets it apart from competitors
- Ends with a forward-looking statement about the brand's future

Remember: write like a human, not like an AI. Use specific language, avoid filler phrases, and make every sentence count.`;

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

  const aboutUsHtml = textBlock.text.trim();

  // Append the contact block at the end
  const contactBlock = buildContactBlock(config);

  return `${aboutUsHtml}\n\n${contactBlock}`;
}
