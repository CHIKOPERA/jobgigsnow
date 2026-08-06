import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "pre",
  "code",
  "br",
  "hr",
  "a",
];

export function sanitizeJobDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  }).trim();
}

export function descriptionContainsHtml(value: string): boolean {
  return /<(?:p|h[2-3]|ul|ol|li|strong|em|u|s|blockquote|pre|code|br|hr|a)(?:\s|>|\/)/i.test(value);
}

export function toEditorHtml(value: string): string {
  if (descriptionContainsHtml(value)) return sanitizeJobDescription(value);
  const escaped = value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br>")}</p>`)
    .join("");
}
