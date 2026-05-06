"use client";

/**
 * AI Prompt Generator for Business - Main Page
 * Build better prompts for ChatGPT, Claude, and other AI tools
 */

import { useState, useEffect, useMemo } from "react";
import styles from "./styles.css";
import { TEMPLATES } from "./lib/templates";
import { buildPrompt, validateVariables, initializeVariables } from "./lib/prompt-builder";
import UseCaseSelector from "./components/UseCaseSelector";
import VariableInput from "./components/VariableInput";
import PromptPreview from "./components/PromptPreview";

export default function AIPromptGeneratorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Initialize variables when template changes
  useEffect(() => {
    const template = TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (template) {
      setVariables(initializeVariables(template));
    }
  }, [selectedTemplateId]);

  // Get current template
  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId]
  );

  // Build prompt and validate
  const prompt = useMemo(() => {
    if (!selectedTemplate) return "";
    return buildPrompt(selectedTemplate, variables);
  }, [selectedTemplate, variables]);

  const validation = useMemo(() => {
    if (!selectedTemplate) return { valid: false, errors: [] };
    return validateVariables(selectedTemplate, variables);
  }, [selectedTemplate, variables]);

  if (!selectedTemplate) {
    return (
      <div className={styles["ai-prompt-generator"]}>
        <p>Error loading template</p>
      </div>
    );
  }

  return (
    <div className={styles["ai-prompt-generator"]}>
      <header className={styles["ai-prompt-generator__header"]}>
        <h1>AI Prompt Generator for Business</h1>
        <p>Build better, more structured prompts for ChatGPT, Claude, and other AI tools</p>
      </header>

      <main className={styles["ai-prompt-generator__main"]}>
        {/* Left column: Use case selector and variable inputs */}
        <aside className={styles["ai-prompt-generator__sidebar"]}>
          <UseCaseSelector
            templates={TEMPLATES}
            selected={selectedTemplateId}
            onSelect={setSelectedTemplateId}
          />

          <VariableInput
            template={selectedTemplate}
            variables={variables}
            onChange={setVariables}
            validation={validation}
          />
        </aside>

        {/* Right column: Prompt preview */}
        <section className={styles["ai-prompt-generator__content"]}>
          <PromptPreview prompt={prompt} isValid={validation.valid} />
        </section>
      </main>

      <footer className={styles["ai-prompt-generator__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["ai-prompt-generator__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export const metadata = {
  title: "AI Prompt Generator for Business - Free Online Tool",
  description:
    "Create structured, high-quality prompts for ChatGPT, Claude, and other AI tools. Pre-built templates for marketing, writing, customer support, and brainstorming.",
  keywords: [
    "AI prompt generator",
    "ChatGPT prompts",
    "Claude prompts",
    "prompt engineering",
    "AI templates",
    "free prompt builder",
  ],
};
