/**
 * Truleaf.org's wordmark, rendered the way Truleaf renders it themselves.
 *
 * Taken from their own codebase (`Truleaf/web`), so this stays their brand
 * rather than our approximation of it:
 *   - `.font-display` in their globals.css → Playfair Display, 700, -0.02em
 *   - their header splits the name: "Truleaf" in --foreground, ".org" in --primary
 *   - we always sit on a dark field, so these are their **dark-mode** tokens:
 *     --foreground #fafafa and --primary #65a474 (their light-mode green,
 *     #386641, is unreadable on our background — that's why they swap it too)
 *
 * The Playfair face is loaded once in app/[locale]/layout.tsx as --font-playfair.
 */
export default function TruleafWordmark({ size = 19 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontSize: size,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span style={{ color: "#FAFAFA" }}>Truleaf</span>
      <span style={{ color: "#65A474" }}>.org</span>
    </span>
  );
}
