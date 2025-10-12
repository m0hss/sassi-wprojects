import DOMPurify from "isomorphic-dompurify";

// Keep only very small, safe subset of inline styles (currently only color with hex or named values).
export function preserveSafeInlineStyles(html: string) {
  if (!html) return html;
  return html.replace(/style\s*=\s*"([^"]*)"/gi, (_, style) => {
    // match color: #hex or color: name
    const m = style.match(/color\s*:\s*(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\s*;?/i);
    if (m) {
      // return only the color property
      return `style="color:${m[1]}"`;
    }
    return ""; // drop any other inline styles
  });
}

export function sanitizeHtml(html: string) {
  if (!html) return "";
  const preCleaned = preserveSafeInlineStyles(html);
  return DOMPurify.sanitize(preCleaned, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "ul",
      "ol",
      "li",
      "br",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
    ],
    // allow style attr but we pre-cleaned it to only contain safe color values
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "style"],
  });
}
