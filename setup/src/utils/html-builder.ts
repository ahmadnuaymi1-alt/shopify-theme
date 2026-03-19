/**
 * Utility functions for building consistent HTML fragments.
 *
 * Each helper returns a small HTML string that can be composed into
 * larger templates. All output is plain HTML (no framework dependencies).
 */

/**
 * Wrap content in a styled section div.
 */
export function wrapInSection(content: string): string {
  return `<div class="policy-section">\n${content}\n</div>`;
}

/**
 * Build a mailto link.
 */
export function mailtoLink(email: string): string {
  return `<a href="mailto:${email}" title="${email}">${email}</a>`;
}

/**
 * Build a tel link.
 */
export function telLink(phone: string): string {
  return `<a href="tel:${phone.replace(/[\s()-]/g, '')}" title="${phone}">${phone}</a>`;
}

/**
 * Build an internal site link.
 */
export function internalLink(text: string, path: string, title?: string): string {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${path}"${titleAttr}>${text}</a>`;
}

/**
 * Build a Google Maps link from an address object.
 * Returns the full address text wrapped in an anchor tag.
 */
export function mapsLink(address: {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}): string {
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${fullAddress}">${fullAddress}</a>`;
}

/**
 * Build an HTML heading at the specified level.
 */
export function heading(text: string, level: 2 | 3): string {
  return `<h${level}>${text}</h${level}>`;
}

/**
 * Build an unordered list from an array of items.
 */
export function bulletList(items: string[]): string {
  const lis = items.map((item) => `  <li>${item}</li>`).join("\n");
  return `<ul>\n${lis}\n</ul>`;
}

/**
 * Build an ordered list from an array of items.
 */
export function numberedList(items: string[]): string {
  const lis = items.map((item) => `  <li>${item}</li>`).join("\n");
  return `<ol>\n${lis}\n</ol>`;
}

/**
 * Wrap text in a paragraph tag.
 */
export function paragraph(text: string): string {
  return `<p>${text}</p>`;
}
