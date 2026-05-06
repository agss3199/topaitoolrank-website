/**
 * AI Prompt Generator - Prompt Templates Library
 * Pre-written templates with {variable} placeholders for business use cases
 */

export interface TemplateVariable {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  variables: TemplateVariable[];
}

export const TEMPLATES: Template[] = [
  {
    id: "email-marketing",
    name: "Email Marketing Campaign",
    category: "Marketing",
    description: "Create compelling marketing emails for product promotion",
    prompt: `You are an expert email copywriter specializing in conversion-focused marketing. Write a professional and engaging marketing email with the following context:

Product/Service: {product_name}
Target Audience: {target_audience}
Primary Goal: {email_goal}
Tone: {tone}
Key Benefit: {key_benefit}

Requirements:
- Attention-grabbing subject line (max 50 chars)
- Personalized opening that resonates with the audience
- Clear explanation of the product value proposition
- Address 2-3 specific pain points of the audience
- Include a strong call-to-action (CTA)
- Professional formatting with proper spacing
- Closing that builds trust

Write the complete email, including the subject line at the top:`,
    variables: [
      {
        name: "product_name",
        label: "Product/Service Name",
        placeholder: "e.g., Cloud Analytics Platform",
        type: "text",
      },
      {
        name: "target_audience",
        label: "Target Audience",
        placeholder: "e.g., SaaS founders, marketing teams",
        type: "text",
      },
      {
        name: "email_goal",
        label: "Email Goal",
        placeholder: "e.g., Schedule a product demo, Free trial signup",
        type: "text",
      },
      {
        name: "tone",
        label: "Tone",
        placeholder: "e.g., Professional, Friendly, Enthusiastic",
        type: "select",
        options: ["Professional", "Friendly", "Enthusiastic", "Casual", "Formal"],
      },
      {
        name: "key_benefit",
        label: "Key Benefit",
        placeholder: "e.g., Saves 10 hours/week on reporting",
        type: "text",
      },
    ],
  },
  {
    id: "product-description",
    name: "Product Description Writer",
    category: "E-commerce",
    description: "Write persuasive product descriptions that sell",
    prompt: `You are an expert e-commerce copywriter. Write a compelling product description with the following details:

Product Name: {product_name}
Product Category: {category}
Target Customer: {target_customer}
Key Features: {key_features}
Price Point: {price_point}
Unique Selling Proposition: {unique_angle}

Requirements:
- Compelling headline (under 80 chars)
- Hook that immediately captures attention
- Benefit-focused (not just features)
- Address common objections
- Social proof or trust signals where applicable
- Clear product specifications
- Strong closing that encourages purchase
- Professional, persuasive tone

Write the complete product description:`,
    variables: [
      {
        name: "product_name",
        label: "Product Name",
        placeholder: "e.g., Wireless Noise-Canceling Headphones",
        type: "text",
      },
      {
        name: "category",
        label: "Category",
        placeholder: "e.g., Electronics, Fashion, Home & Garden",
        type: "text",
      },
      {
        name: "target_customer",
        label: "Target Customer",
        placeholder: "e.g., Remote workers, students, commuters",
        type: "text",
      },
      {
        name: "key_features",
        label: "Key Features",
        placeholder: "e.g., 48-hour battery, active noise cancellation, comfortable fit",
        type: "textarea",
      },
      {
        name: "price_point",
        label: "Price Point",
        placeholder: "e.g., Premium ($200+), Mid-range ($50-100), Budget (<$50)",
        type: "text",
      },
      {
        name: "unique_angle",
        label: "Unique Selling Point",
        placeholder: "e.g., Made from recycled materials, best-in-class sound quality",
        type: "text",
      },
    ],
  },
  {
    id: "social-media-post",
    name: "Social Media Post Creator",
    category: "Social Media",
    description: "Create engaging posts for Twitter, LinkedIn, Facebook, and Instagram",
    prompt: `You are a social media marketing expert. Create an engaging and platform-optimized post with the following context:

Platform: {platform}
Content Topic: {topic}
Target Audience: {audience}
Call-to-Action: {cta}
Tone: {tone}
Additional Context: {additional_context}

Requirements:
- Optimized length for the platform ({platform} best practices)
- Attention-grabbing opening line
- Include relevant hashtags (3-5 for Twitter, 5-10 for Instagram)
- Emojis where appropriate and authentic to the brand
- Clear value proposition
- Engaging question or call-to-action
- Platform-specific formatting

Write the complete social media post:`,
    variables: [
      {
        name: "platform",
        label: "Platform",
        placeholder: "e.g., Twitter, LinkedIn, Instagram, Facebook",
        type: "select",
        options: ["Twitter", "LinkedIn", "Instagram", "Facebook", "TikTok"],
      },
      {
        name: "topic",
        label: "Content Topic",
        placeholder: "e.g., New feature launch, industry tip, company culture",
        type: "text",
      },
      {
        name: "audience",
        label: "Target Audience",
        placeholder: "e.g., Marketing professionals, tech enthusiasts, small business owners",
        type: "text",
      },
      {
        name: "cta",
        label: "Call-to-Action",
        placeholder: "e.g., Click the link below, Share your thoughts, Join our community",
        type: "text",
      },
      {
        name: "tone",
        label: "Tone",
        placeholder: "e.g., Inspirational, Educational, Entertaining, Professional",
        type: "select",
        options: ["Inspirational", "Educational", "Entertaining", "Professional", "Humorous"],
      },
      {
        name: "additional_context",
        label: "Additional Context",
        placeholder: "e.g., Brand voice, current event, promotion details",
        type: "textarea",
      },
    ],
  },
  {
    id: "brainstorming",
    name: "Brainstorming & Ideation",
    category: "Creative",
    description: "Generate creative ideas for content, products, campaigns",
    prompt: `You are a creative thinking partner and brainstorming facilitator. Generate innovative ideas based on the following:

Project/Topic: {topic}
Goal: {goal}
Constraints/Requirements: {constraints}
Industry/Context: {industry}
Audience: {audience}
Number of Ideas: {num_ideas}

Requirements:
- Diverse range of approaches (bold ideas + practical ones)
- Creative but actionable
- Address the stated goal
- Consider the constraints
- Provide reasoning for each idea
- Format as a numbered list with brief descriptions
- Think outside the box but stay relevant

Generate creative ideas:`,
    variables: [
      {
        name: "topic",
        label: "Project Topic",
        placeholder: "e.g., New marketing campaign, Product feature, Blog content strategy",
        type: "text",
      },
      {
        name: "goal",
        label: "Goal",
        placeholder: "e.g., Increase user engagement, Reduce churn, Generate leads",
        type: "text",
      },
      {
        name: "constraints",
        label: "Constraints/Budget",
        placeholder: "e.g., Budget < $5k, Must launch in 2 weeks, Limited team of 3",
        type: "textarea",
      },
      {
        name: "industry",
        label: "Industry/Context",
        placeholder: "e.g., SaaS, E-commerce, Non-profit, Education",
        type: "text",
      },
      {
        name: "audience",
        label: "Target Audience",
        placeholder: "e.g., Millennials, B2B buyers, Gen Z",
        type: "text",
      },
      {
        name: "num_ideas",
        label: "Number of Ideas",
        placeholder: "e.g., 5, 10, 15",
        type: "select",
        options: ["3", "5", "7", "10", "15"],
      },
    ],
  },
  {
    id: "customer-support",
    name: "Customer Support Response",
    category: "Customer Service",
    description: "Write helpful, empathetic customer support responses",
    prompt: `You are a professional customer support representative with excellent communication skills. Write a support response to address the following customer issue:

Customer Issue: {issue}
Customer Sentiment: {sentiment}
Product/Service: {product}
Tone for Response: {tone}
Company Name: {company_name}
Resolution Offered: {resolution}

Requirements:
- Start with empathy and acknowledgment of their issue
- Avoid jargon; use clear, simple language
- Address their specific concern
- Provide the solution clearly
- Include next steps if needed
- End on a positive note
- Professional but warm tone
- Keep it concise but complete

Write the customer support response:`,
    variables: [
      {
        name: "issue",
        label: "Customer Issue",
        placeholder: "e.g., Feature not working, billing error, product quality concern",
        type: "textarea",
      },
      {
        name: "sentiment",
        label: "Customer Sentiment",
        placeholder: "e.g., Frustrated, Neutral, Very upset",
        type: "select",
        options: ["Frustrated", "Neutral", "Upset", "Angry", "Satisfied"],
      },
      {
        name: "product",
        label: "Product/Service Name",
        placeholder: "e.g., Analytics Dashboard, Mobile App",
        type: "text",
      },
      {
        name: "tone",
        label: "Response Tone",
        placeholder: "e.g., Friendly, Professional, Apologetic",
        type: "select",
        options: ["Friendly", "Professional", "Apologetic", "Enthusiastic"],
      },
      {
        name: "company_name",
        label: "Company Name",
        placeholder: "e.g., Acme Corp",
        type: "text",
      },
      {
        name: "resolution",
        label: "Resolution Offered",
        placeholder: "e.g., Full refund, Free premium month, Technical fix",
        type: "text",
      },
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  const categories = TEMPLATES.map((t) => t.category);
  return Array.from(new Set(categories)).sort();
}
