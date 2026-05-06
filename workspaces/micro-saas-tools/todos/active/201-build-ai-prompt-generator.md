# Build: AI Prompt Generator for Business

**ID**: 201  
**Effort**: 3–4 hours  
**Implements**: specs/micro-saas-tools.md § 5 (Tool List: Wave 2, Tool 4)  
**Depends on**: 001

## Description

Build the AI Prompt Generator UI and template system. This tool helps business users create high-quality prompts for AI (ChatGPT, Claude, etc.) by offering structured templates, variable injection, and real-time preview.

### What Users Do

1. Select a **use case** from dropdown (e.g., "Email Marketing", "Product Description", "Brainstorming")
2. Enter **variables** (e.g., product name, target audience, tone)
3. Tool generates a **structured prompt** with all variables filled in
4. User can customize, then copy to clipboard or download

### Core Logic

- **Use case templates**: Pre-written prompt templates with placeholders (`{variable_name}`)
- **Variable substitution**: Replace `{variable_name}` with user input
- **Preview**: Real-time display of final prompt
- **Output**: Plain text prompt ready for ChatGPT/Claude

## Files to Create

```
app/tools/ai-prompt-generator/
├── page.tsx                 # Main page
├── styles.css               # All styling (namespace-scoped)
├── lib/
│   ├── templates.ts         # Prompt templates & metadata
│   └── prompt-builder.ts    # Variable substitution logic
└── components/
    ├── UseCaseSelector.tsx  # Use case dropdown
    ├── VariableInput.tsx    # Dynamic input fields
    └── PromptPreview.tsx    # Real-time preview
```

## Technical Approach

### Use Case Templates

Store templates as objects with metadata:

```typescript
// lib/templates.ts

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string; // Template with {variable} placeholders
  variables: {
    name: string;
    label: string;
    placeholder: string;
    type: "text" | "textarea" | "select";
    options?: string[]; // For select type
  }[];
}

export const TEMPLATES: Template[] = [
  {
    id: "email-marketing",
    name: "Email Marketing",
    category: "Marketing",
    description: "Create engaging marketing emails",
    prompt: `You are an expert email copywriter. Write a marketing email for {product_name}.
    
Target audience: {target_audience}
Email goal: {email_goal}
Tone: {tone}

Requirements:
- Subject line that stands out
- Compelling opening hook
- Clear value proposition
- CTA
- Professional but engaging

Write the complete email:`,
    variables: [
      { name: "product_name", label: "Product/Service", placeholder: "e.g., SaaS Tool" },
      { name: "target_audience", label: "Target Audience", placeholder: "e.g., Startups" },
      { name: "email_goal", label: "Goal", placeholder: "e.g., Demo signup" },
      { name: "tone", label: "Tone", placeholder: "e.g., Professional, Friendly" }
    ]
  },
  // ... more templates
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}
```

### Prompt Builder

```typescript
// lib/prompt-builder.ts

export function buildPrompt(template: Template, variables: Record<string, string>): string {
  let prompt = template.prompt;
  
  // Replace each variable placeholder with user input
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    prompt = prompt.replaceAll(placeholder, value);
  }
  
  return prompt;
}

export function validateVariables(
  template: Template,
  variables: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of template.variables) {
    if (!variables[field.name] || !variables[field.name].trim()) {
      errors.push(`${field.label} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Page Structure

```typescript
// app/tools/ai-prompt-generator/page.tsx

import { useState } from "react";
import { TEMPLATES } from "./lib/templates";
import { buildPrompt, validateVariables } from "./lib/prompt-builder";
import UseCaseSelector from "./components/UseCaseSelector";
import VariableInput from "./components/VariableInput";
import PromptPreview from "./components/PromptPreview";
import styles from "./styles.css";

export default function AIPromptGeneratorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [variables, setVariables] = useState<Record<string, string>>({});
  
  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);
  
  if (!selectedTemplate) return <div>Error loading template</div>;
  
  const prompt = buildPrompt(selectedTemplate, variables);
  const validation = validateVariables(selectedTemplate, variables);
  
  return (
    <div className={styles["ai-prompt-generator"]}>
      <header className={styles["ai-prompt-generator__header"]}>
        <h1>AI Prompt Generator for Business</h1>
        <p>Build better prompts for ChatGPT, Claude, and other AI tools</p>
      </header>
      
      <main className={styles["ai-prompt-generator__main"]}>
        <section className={styles["ai-prompt-generator__selector"]}>
          <UseCaseSelector
            templates={TEMPLATES}
            selected={selectedTemplateId}
            onSelect={setSelectedTemplateId}
          />
        </section>
        
        <section className={styles["ai-prompt-generator__inputs"]}>
          <VariableInput
            template={selectedTemplate}
            variables={variables}
            onChange={setVariables}
            validation={validation}
          />
        </section>
        
        <section className={styles["ai-prompt-generator__preview"]}>
          <PromptPreview
            prompt={prompt}
            isValid={validation.valid}
          />
        </section>
      </main>
    </div>
  );
}

export const metadata = {
  title: "AI Prompt Generator for Business - Free Online Tool",
  description: "Create structured, high-quality prompts for ChatGPT, Claude, and AI tools. Pre-built templates for marketing, writing, brainstorming.",
};
```

### CSS Structure

All CSS scoped to `.ai-prompt-generator` namespace:

```css
/* app/tools/ai-prompt-generator/styles.css */

:root {
  --apg-color-bg: #f9fafb;
  --apg-color-bg-input: #ffffff;
  --apg-color-text: #1f2937;
  --apg-color-text-secondary: #6b7280;
  --apg-color-border: #e5e7eb;
  --apg-color-accent: #3b82f6;
  --apg-color-accent-hover: #2563eb;
  --apg-spacing: 4px;
}

.ai-prompt-generator {
  background-color: var(--apg-color-bg);
  color: var(--apg-color-text);
  padding: calc(6 * var(--apg-spacing)); /* 24px */
  max-width: 1200px;
  margin: 0 auto;
}

.ai-prompt-generator__header {
  margin-bottom: calc(8 * var(--apg-spacing)); /* 32px */
}

.ai-prompt-generator__header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 calc(2 * var(--apg-spacing)) 0;
}

.ai-prompt-generator__header p {
  font-size: 16px;
  color: var(--apg-color-text-secondary);
  margin: 0;
}

/* Responsive grid */
.ai-prompt-generator__main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: calc(6 * var(--apg-spacing)); /* 24px */
}

@media (max-width: 768px) {
  .ai-prompt-generator__main {
    grid-template-columns: 1fr;
  }
}

/* Other sections... */
```

## Acceptance Criteria

Build phase — UI and logic, NO localStorage/download yet:

- [ ] Page loads without errors
- [ ] Use case dropdown displays all templates
- [ ] Variable input fields render based on selected template
- [ ] Real-time prompt preview updates as user types
- [ ] Form validation shows errors for missing variables
- [ ] All CSS is scoped to `.ai-prompt-generator` namespace
- [ ] No imports from shared `lib/`, `components/`, `utils/`
- [ ] Responsive on 320px–2560px
- [ ] SEO metadata exported

## Component Details (Optional Reference)

### UseCaseSelector Component

```typescript
interface Props {
  templates: Template[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function UseCaseSelector({ templates, selected, onSelect }: Props) {
  return (
    <div className="ai-prompt-generator__selector-container">
      <label className="ai-prompt-generator__label">Select a Use Case</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="ai-prompt-generator__select"
      >
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### VariableInput Component

```typescript
interface Props {
  template: Template;
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
  validation: { valid: boolean; errors: string[] };
}

export default function VariableInput({
  template,
  variables,
  onChange,
  validation
}: Props) {
  const handleChange = (name: string, value: string) => {
    onChange({ ...variables, [name]: value });
  };

  return (
    <div className="ai-prompt-generator__input-container">
      {template.variables.map(field => (
        <div key={field.name} className="ai-prompt-generator__field">
          <label className="ai-prompt-generator__label">{field.label}</label>
          {field.type === "textarea" ? (
            <textarea
              value={variables[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="ai-prompt-generator__textarea"
              rows={4}
            />
          ) : field.type === "select" ? (
            <select
              value={variables[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="ai-prompt-generator__select"
            >
              <option value="">Select an option...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={variables[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="ai-prompt-generator__input"
            />
          )}
        </div>
      ))}
      {!validation.valid && (
        <div className="ai-prompt-generator__error">
          {validation.errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### PromptPreview Component

```typescript
interface Props {
  prompt: string;
  isValid: boolean;
}

export default function PromptPreview({ prompt, isValid }: Props) {
  return (
    <div className="ai-prompt-generator__preview-container">
      <h3 className="ai-prompt-generator__preview-title">Generated Prompt</h3>
      <div className="ai-prompt-generator__preview-box">
        <p className="ai-prompt-generator__preview-text">
          {isValid ? prompt : "Fill in all fields to generate prompt"}
        </p>
      </div>
      {isValid && (
        <p className="ai-prompt-generator__preview-hint">
          Ready to copy — see next todo (202) for copy button wiring
        </p>
      )}
    </div>
  );
}
```

## Verification Checklist

- [ ] All 5+ templates available in dropdown
- [ ] Variable input fields match template requirements
- [ ] Real-time preview shows final prompt
- [ ] Form validation works
- [ ] No imports from shared resources
- [ ] Responsive layout working
- [ ] No TypeScript errors
- [ ] Ready for wire phase (202)

## Notes

- This is the BUILD phase — focus on UI and core logic
- Copy/download/localStorage handled in TODO 202 (WIRE phase)
- Testing (unit + E2E) in TODO 203

## Deviation Log

_None yet_
