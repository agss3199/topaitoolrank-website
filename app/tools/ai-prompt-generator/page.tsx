"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

/**
 * AI Prompt Generator for Business - Main Page
 * Build better prompts for ChatGPT, Claude, and other AI tools
 */


import { useState, useEffect, useMemo } from "react";
import Header from "../lib/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";
import { TEMPLATES } from "./lib/templates";
import { buildPrompt, validateVariables, initializeVariables } from "./lib/prompt-builder";
import { copyToClipboard, downloadAsFile, saveTolocalStorage, loadFromlocalStorage } from "./lib/utils";
import { cls } from "../lib/css-module-safe";
import { ArticleSection } from "../lib/ArticleSection";
import UseCaseSelector from "./components/UseCaseSelector";
import VariableInput from "./components/VariableInput";
import PromptPreview from "./components/PromptPreview";

const LOCALSTORAGE_TEMPLATE_KEY = "apg-template";
const LOCALSTORAGE_VARIABLES_PREFIX = "apg-var-";

export default function AIPromptGeneratorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [articleContent, setArticleContent] = useState<string>("");
  const [articleLoading, setArticleLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedTemplateId = loadFromlocalStorage(LOCALSTORAGE_TEMPLATE_KEY);
    if (savedTemplateId && TEMPLATES.find((t) => t.id === savedTemplateId)) {
      setSelectedTemplateId(savedTemplateId);
    }
  }, []);

  // Initialize variables when template changes
  useEffect(() => {
    const template = TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (template) {
      const newVars = initializeVariables(template);
      // Try to load saved variables for this template
      for (const field of template.variables) {
        const saved = loadFromlocalStorage(`${LOCALSTORAGE_VARIABLES_PREFIX}${selectedTemplateId}-${field.name}`);
        if (saved) {
          newVars[field.name] = saved;
        }
      }
      setVariables(newVars);
    }
  }, [selectedTemplateId]);

  // Save template selection to localStorage
  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    saveTolocalStorage(LOCALSTORAGE_TEMPLATE_KEY, id);
  };

  // Save variables to localStorage when they change
  const handleVariablesChange = (newVars: Record<string, string>) => {
    setVariables(newVars);
    // Save each variable individually
    for (const [key, value] of Object.entries(newVars)) {
      saveTolocalStorage(`${LOCALSTORAGE_VARIABLES_PREFIX}${selectedTemplateId}-${key}`, value);
    }
  };

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
  // Load article content
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await fetch('/api/tools/article?tool=ai-prompt-generator');
        if (res.ok) {
          const data = await res.json();
          setArticleContent(data.content || '');
        }
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setArticleLoading(false);
      }
    };
    loadArticle();
  }, []);

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopyMessage("✓ Copied to clipboard!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  const handleDownloadPrompt = () => {
    const filename = `prompt-${selectedTemplateId}-${Date.now()}.txt`;
    downloadAsFile(prompt, filename);
  };

  if (!selectedTemplate) {
    return (
      <div className={cls(styles, "ai-prompt-generator")}>
        <p>Error loading template</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className={cls(styles, "ai-prompt-generator")}>
        <header className={cls(styles, "ai-prompt-generator__header")}>
          <h1>AI Prompt Generator for Business</h1>
          <p>Build better, more structured prompts for ChatGPT, Claude, and other AI tools</p>
        </header>

        <main className={cls(styles, "ai-prompt-generator__main")}>
        {/* Left column: Use case selector and variable inputs */}
        <aside className={cls(styles, "ai-prompt-generator__sidebar")}>
          <UseCaseSelector
            templates={TEMPLATES}
            selected={selectedTemplateId}
            onSelect={handleTemplateChange}
          />

          <VariableInput
            template={selectedTemplate}
            variables={variables}
            onChange={handleVariablesChange}
            validation={validation}
          />
        </aside>

        {/* Right column: Prompt preview and actions */}
        <section className={cls(styles, "ai-prompt-generator__content")}>
          <PromptPreview prompt={prompt} isValid={validation.valid} />

          {validation.valid && (
            <div className={cls(styles, "ai-prompt-generator__actions")}>
              <button
                className={cls(styles, "ai-prompt-generator__button")}
                onClick={handleCopyPrompt}
              >
                📋 Copy Prompt
              </button>
              <button
                className={cls(styles, "ai-prompt-generator__button")}
                onClick={handleDownloadPrompt}
              >
                ⬇️ Download
              </button>
            </div>
          )}

          {copyMessage && (
            <div className={cls(styles, "ai-prompt-generator__copy-message")}>
              {copyMessage}
            </div>
          )}
        </section>

        <footer className={cls(styles, "ai-prompt-generator__footer")}>
          <p>
            <small>
              Free tool by{" "}
              <a href="/" className={cls(styles, "ai-prompt-generator__link")}>
                topaitoolrank.com
              </a>
            </small>
          </p>
        </footer>
      </main>
    </div>
    {/* Article Section */}
      {!articleLoading && articleContent && (
        <div className={cls(styles, "ai-prompt-generator__article-container")}>
          <ArticleSection content={articleContent} />
        </div>
      )}
    <Footer />
    </>
  );
}

