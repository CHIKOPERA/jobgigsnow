import TurndownService from "turndown";

const turndownService = new TurndownService({ headingStyle: "atx" });

/** Converts the page to Markdown — extra context handed to the AI aggregation stage, not itself
 *  a reconciliation candidate source. */
export function extractMarkdown(html: string): string | null {
  try {
    const markdown = turndownService.turndown(html).trim();
    return markdown.length > 0 ? markdown : null;
  } catch {
    return null;
  }
}
