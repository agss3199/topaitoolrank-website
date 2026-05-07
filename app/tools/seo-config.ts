/**
 * SEO Configuration for all tools
 * Used to generate metadata, OG tags, and structured data for each tool page
 */

export interface ToolSEOConfig {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  keywords: string[];
  ogImage: string;
  color: string;
  emoji: string;
  features: string[];
  category: "Featured" | "Text & Language" | "Links & UTM" | "Content" | "Messaging";
  url: string;
}

export const TOOL_SEO_CONFIG: Record<string, ToolSEOConfig> = {
  "json-formatter": {
    slug: "json-formatter",
    title: "JSON Formatter & Validator - Free Online Tool",
    description: "Format, validate, and beautify JSON with our free online tool. Minify JSON, check syntax, and convert between formats instantly.",
    longDescription: "The JSON Formatter is a powerful online tool for developers to format, validate, and beautify JSON data. Instantly detect syntax errors, pretty-print JSON structures, minify for production, and convert between different formats. Perfect for debugging APIs, working with config files, and data transformation.",
    keywords: ["json formatter", "json validator", "json beautifier", "minify json", "pretty print json"],
    ogImage: "/og-images/json-formatter.png",
    color: "#3b82f6",
    emoji: "{}",
    features: ["Format & Beautify", "Validate Syntax", "Minify JSON", "Error Detection", "Copy to Clipboard"],
    category: "Featured",
    url: "https://topaitoolrank.com/tools/json-formatter",
  },
  "word-counter": {
    slug: "word-counter",
    title: "Word Counter & Text Analyzer - Free Online Tool",
    description: "Count words, characters, sentences, and paragraphs instantly. Analyze reading time and get detailed text statistics with our free word counter tool.",
    longDescription: "The Word Counter is a comprehensive text analysis tool that counts words, characters (with and without spaces), sentences, paragraphs, and calculates estimated reading time. Track word frequency, analyze text metrics, and get detailed insights about your content in real-time.",
    keywords: ["word counter", "character counter", "text analyzer", "reading time calculator", "word frequency"],
    ogImage: "/og-images/word-counter.png",
    color: "#10b981",
    emoji: "📊",
    features: ["Word Count", "Character Count", "Reading Time", "Word Frequency", "Statistics"],
    category: "Featured",
    url: "https://topaitoolrank.com/tools/word-counter",
  },
  "email-subject-tester": {
    slug: "email-subject-tester",
    title: "Email Subject Line Tester - Free Preview Tool",
    description: "Test email subject lines across devices and preview how they appear in inboxes. Optimize open rates with our free email subject tester.",
    longDescription: "The Email Subject Tester helps marketers and email professionals optimize subject lines by showing how they appear across different email clients and devices. Preview truncation points, test emoji rendering, and analyze character length to maximize open rates and engagement.",
    keywords: ["email subject tester", "subject line preview", "email marketing tool", "inbox preview", "open rate optimizer"],
    ogImage: "/og-images/email-subject-tester.png",
    color: "#f97316",
    emoji: "✉️",
    features: ["Multi-Device Preview", "Character Counter", "Emoji Support", "Truncation Detection", "Best Practices"],
    category: "Text & Language",
    url: "https://topaitoolrank.com/tools/email-subject-tester",
  },
  "ai-prompt-generator": {
    slug: "ai-prompt-generator",
    title: "AI Prompt Generator - Create Perfect Prompts for ChatGPT & AI",
    description: "Generate optimized AI prompts for ChatGPT, Claude, and other language models. Create better results with our free prompt engineering tool.",
    longDescription: "The AI Prompt Generator helps you craft effective prompts for AI language models including ChatGPT, Claude, and others. Use advanced prompt templates, learn best practices, and generate prompts that produce higher-quality responses with better consistency and specificity.",
    keywords: ["prompt generator", "ai prompt engineering", "chatgpt prompt", "prompt templates", "ai tool"],
    ogImage: "/og-images/ai-prompt-generator.png",
    color: "#a855f7",
    emoji: "✨",
    features: ["Prompt Templates", "Best Practices", "Model Selection", "Refinement Suggestions", "Examples"],
    category: "Content",
    url: "https://topaitoolrank.com/tools/ai-prompt-generator",
  },
  "utm-link-builder": {
    slug: "utm-link-builder",
    title: "UTM Link Builder - Create Trackable URLs for Analytics",
    description: "Build UTM parameters and trackable URLs for Google Analytics. Monitor campaign performance with our free UTM parameter builder.",
    longDescription: "The UTM Link Builder simplifies campaign tracking by generating UTM-tagged URLs for Google Analytics and other platforms. Easily add utm_source, utm_medium, utm_campaign, and other parameters to track marketing performance across channels and campaigns.",
    keywords: ["utm builder", "utm parameter", "google analytics", "campaign tracking", "url builder"],
    ogImage: "/og-images/utm-link-builder.png",
    color: "#ef4444",
    emoji: "🔗",
    features: ["UTM Parameter Builder", "Campaign Tracking", "Analytics Integration", "QR Code Generator", "Bulk URL Creation"],
    category: "Links & UTM",
    url: "https://topaitoolrank.com/tools/utm-link-builder",
  },
  "invoice-generator": {
    slug: "invoice-generator",
    title: "Invoice Generator - Create Professional Invoices Free",
    description: "Generate professional invoices instantly. Create, customize, and download invoices for your business with our free invoice generator.",
    longDescription: "The Invoice Generator helps small business owners and freelancers create professional invoices quickly. Customize your invoice with logo, company details, itemized charges, and payment terms. Download as PDF or print directly.",
    keywords: ["invoice generator", "invoice maker", "free invoice", "professional invoice", "business invoicing"],
    ogImage: "/og-images/invoice-generator.png",
    color: "#6b7280",
    emoji: "📄",
    features: ["Professional Templates", "PDF Export", "Customization", "Tax Calculation", "Payment Terms"],
    category: "Content",
    url: "https://topaitoolrank.com/tools/invoice-generator",
  },
  "seo-analyzer": {
    slug: "seo-analyzer",
    title: "SEO Analyzer Tool - Check Website Optimization",
    description: "Analyze your website's SEO performance. Check page structure, meta tags, content quality, and get actionable recommendations to improve rankings.",
    longDescription: "The SEO Analyzer scans your web pages for SEO issues and provides detailed recommendations for improvement. Check meta tags, heading structure, content optimization, mobile responsiveness, and technical SEO factors to improve search engine visibility.",
    keywords: ["seo analyzer", "seo checker", "website audit", "seo tool", "search engine optimization"],
    ogImage: "/og-images/seo-analyzer.png",
    color: "#06b6d4",
    emoji: "📈",
    features: ["Page Audit", "Meta Tag Analysis", "Keyword Optimization", "Mobile Check", "Performance Metrics"],
    category: "Content",
    url: "https://topaitoolrank.com/tools/seo-analyzer",
  },
  "whatsapp-link-generator": {
    slug: "whatsapp-link-generator",
    title: "WhatsApp Link Generator - Create Click-to-Chat Links",
    description: "Generate WhatsApp click-to-chat links and QR codes. Direct customers to WhatsApp conversations with pre-filled messages.",
    longDescription: "The WhatsApp Link Generator creates clickable links and QR codes that open WhatsApp conversations. Perfect for businesses, support teams, and customer engagement. Generate links with pre-filled messages and share across channels.",
    keywords: ["whatsapp link generator", "whatsapp qr code", "whatsapp business", "click to chat", "whatsapp marketing"],
    ogImage: "/og-images/whatsapp-link-generator.png",
    color: "#25d366",
    emoji: "💬",
    features: ["Link Generator", "QR Code Creation", "Pre-filled Messages", "Batch Generation", "Analytics Tracking"],
    category: "Messaging",
    url: "https://topaitoolrank.com/tools/whatsapp-link-generator",
  },
  "whatsapp-message-formatter": {
    slug: "whatsapp-message-formatter",
    title: "WhatsApp Message Formatter - Format Text & Emojis",
    description: "Format WhatsApp messages with bold, italic, and special formatting. Create beautifully formatted messages for WhatsApp.",
    longDescription: "The WhatsApp Message Formatter lets you create formatted WhatsApp messages with bold, italic, strikethrough, and monospace text. Preview your formatting before sending and ensure your messages stand out with proper formatting and emoji support.",
    keywords: ["whatsapp formatter", "whatsapp text formatting", "whatsapp bold text", "message formatter", "whatsapp emoji"],
    ogImage: "/og-images/whatsapp-message-formatter.png",
    color: "#25d366",
    emoji: "📝",
    features: ["Text Formatting", "Emoji Support", "Live Preview", "Copy to Clipboard", "Multiple Styles"],
    category: "Messaging",
    url: "https://topaitoolrank.com/tools/whatsapp-message-formatter",
  },
};

/**
 * Get SEO config for a specific tool
 */
export function getToolSEOConfig(slug: string): ToolSEOConfig | null {
  return TOOL_SEO_CONFIG[slug] || null;
}

/**
 * Get all tools grouped by category
 */
export function getToolsByCategory(): Record<string, ToolSEOConfig[]> {
  const grouped: Record<string, ToolSEOConfig[]> = {};

  Object.values(TOOL_SEO_CONFIG).forEach((tool) => {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  });

  return grouped;
}

/**
 * Generate structured data (JSON-LD) for a tool
 */
export function generateStructuredData(tool: ToolSEOConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.title,
    "description": tool.longDescription,
    "url": tool.url,
    "applicationCategory": "Utility",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "image": tool.ogImage,
  };
}

/**
 * Generate Open Graph metadata for a tool
 */
export function generateOGMetadata(tool: ToolSEOConfig) {
  return {
    title: tool.title,
    description: tool.description,
    image: tool.ogImage,
    url: tool.url,
    type: "website",
  };
}
