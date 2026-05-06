/**
 * Markdown to WhatsApp Formatting Converter
 *
 * Converts markdown-style text to WhatsApp formatting:
 * - **bold** → *bold*
 * - _italic_ or *italic* → _italic_
 * - `code` → ```code```
 * - ***bold italic*** → ***bold italic***
 */

export interface ConversionResult {
  formatted: string;
  patterns: {
    bold: number;
    italic: number;
    code: number;
    boldItalic: number;
    strikethrough: number;
    monospace: number;
  };
}

/**
 * Convert markdown formatting to WhatsApp formatting
 *
 * Patterns converted:
 * 1. **bold** or __bold__ → *bold*
 * 2. *italic* or _italic_ → _italic_
 * 3. ***bold italic*** or ___bold italic___ → ***bold italic***
 * 4. `code` → ```code```
 * 5. ~~strikethrough~~ → ~~strikethrough~~ (WhatsApp supports this)
 * 6. ``` ```monospace block``` ``` → ```monospace block``` (preserve)
 */
export function markdownToWhatsApp(markdown: string): ConversionResult {
  if (!markdown) {
    return {
      formatted: "",
      patterns: {
        bold: 0,
        italic: 0,
        code: 0,
        boldItalic: 0,
        strikethrough: 0,
        monospace: 0,
      },
    };
  }

  let result = markdown;
  const patterns = {
    bold: 0,
    italic: 0,
    code: 0,
    boldItalic: 0,
    strikethrough: 0,
    monospace: 0,
  };

  // 1. Convert **bold** or __bold__ to *bold*
  // Must be done before italic to avoid conflicts
  const boldPattern = /\*\*(.+?)\*\*|__(.+?)__/g;
  const boldMatches = markdown.match(boldPattern) || [];
  result = result.replace(boldPattern, (match, p1, p2) => {
    const content = p1 || p2;
    patterns.bold++;
    return `*${content}*`;
  });

  // 2. Convert ***bold italic*** or ___bold italic___ to ***bold italic***
  // This pattern must be checked separately (already converted above)
  const boldItalicPattern = /\*\*\*(.+?)\*\*\*|___(.+?)___/g;
  const boldItalicMatches = result.match(boldItalicPattern) || [];
  patterns.boldItalic = boldItalicMatches.length;

  // 3. Convert *italic* or _italic_ to _italic_
  // Be careful not to conflict with bold (*text*)
  const italicPattern = /(?<!\*)\*([^\*]+)\*(?!\*)|_([^_]+)_/g;
  result = result.replace(italicPattern, (match, p1, p2) => {
    const content = p1 || p2;
    // Skip if it's already converted to bold (*text*)
    if (match.startsWith("*") && match.endsWith("*")) {
      // This is already bold, skip
      return match;
    }
    patterns.italic++;
    return `_${content}_`;
  });

  // 4. Convert `code` to ```code```
  const codePattern = /`([^`]+)`/g;
  result = result.replace(codePattern, (match, p1) => {
    patterns.code++;
    return `\`\`\`${p1}\`\`\``;
  });

  // 5. Preserve ``` ```monospace block``` ```
  // This pattern already has backticks, so it should be preserved
  const monoPattern = /```([^`]+)```/g;
  const monoMatches = result.match(monoPattern) || [];
  patterns.monospace = monoMatches.length;

  // 6. Preserve ~~strikethrough~~
  const strikePattern = /~~([^~]+)~~/g;
  const strikeMatches = result.match(strikePattern) || [];
  patterns.strikethrough = strikeMatches.length;

  return {
    formatted: result,
    patterns,
  };
}

/**
 * Get markdown syntax hints for user
 */
export const MARKDOWN_SYNTAX_HINTS = [
  { markdown: "**bold text**", whatsapp: "*bold text*", description: "Bold" },
  { markdown: "_italic text_", whatsapp: "_italic text_", description: "Italic" },
  {
    markdown: "***bold italic***",
    whatsapp: "***bold italic***",
    description: "Bold Italic",
  },
  { markdown: "`code`", whatsapp: "```code```", description: "Code" },
  {
    markdown: "~~strikethrough~~",
    whatsapp: "~~strikethrough~~",
    description: "Strikethrough",
  },
];

/**
 * Validate if text contains any markdown patterns
 */
export function hasMarkdown(text: string): boolean {
  const patterns = [
    /\*\*.*?\*\*/,     // bold
    /__.*?__/,         // bold alternate
    /\*.*?\*/,         // italic
    /_.*?_/,           // italic alternate
    /`.*?`/,           // code
    /~~.*?~~/,         // strikethrough
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Get statistics about formatting in text
 */
export function getFormattingStats(text: string): {
  totalFormatted: number;
  hasFormatting: boolean;
  isEmpty: boolean;
} {
  const conversion = markdownToWhatsApp(text);
  const totalFormatted =
    conversion.patterns.bold +
    conversion.patterns.italic +
    conversion.patterns.code +
    conversion.patterns.boldItalic +
    conversion.patterns.strikethrough;

  return {
    totalFormatted,
    hasFormatting: totalFormatted > 0,
    isEmpty: !text || text.trim().length === 0,
  };
}
