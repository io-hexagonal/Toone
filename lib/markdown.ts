/**
 * Minimal markdown-to-HTML converter.
 * Handles: ## headings, **bold**, *italic*, `inline code`,
 * ```code blocks```, - list items, and paragraph breaks (\n\n).
 */
export function markdownToHtml(md: string): string {
  // Normalize line endings
  let text = md.replace(/\r\n/g, "\n");

  // Code blocks (``` ... ```)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const cls = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // Split into paragraphs
  const blocks = text.split(/\n\n+/);
  const html = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return "";

      // Already processed code blocks
      if (block.startsWith("<pre>")) return block;

      // Headings
      if (block.startsWith("### ")) {
        return `<h3>${inline(block.slice(4))}</h3>`;
      }
      if (block.startsWith("## ")) {
        return `<h2>${inline(block.slice(3))}</h2>`;
      }
      if (block.startsWith("# ")) {
        return `<h1>${inline(block.slice(2))}</h1>`;
      }

      // List items (consecutive lines starting with -)
      const lines = block.split("\n");
      if (lines.every((l) => l.startsWith("- "))) {
        const items = lines
          .map((l) => `<li>${inline(l.slice(2))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      // Regular paragraph
      return `<p>${inline(block.replace(/\n/g, "<br>"))}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

function inline(text: string): string {
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return text;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
