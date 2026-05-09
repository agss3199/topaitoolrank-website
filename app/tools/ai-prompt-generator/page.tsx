"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

/**
 * AI Prompt Generator for Business - Main Page
 * Build better prompts for ChatGPT, Claude, and other AI tools
 */


import { useState, useEffect, useMemo } from "react";
import Header from "@/app/components/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";
import { TEMPLATES } from "./lib/templates";
import { buildPrompt, validateVariables, initializeVariables } from "./lib/prompt-builder";
import { copyToClipboard, downloadAsFile, saveTolocalStorage, loadFromlocalStorage } from "./lib/utils";
import { cls } from "../lib/css-module-safe";
import BreadcrumbSchema from "../lib/BreadcrumbSchema";
import { ArticleSection } from "../lib/ArticleSection";
import FAQSchema from "../lib/FAQSchema";
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
  const [articleError, setArticleError] = useState<string>("");
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
          setArticleError('');
        } else {
          setArticleError('Failed to load article: ' + (res.statusText || 'Unknown error'));
          setArticleContent('');
        }
      } catch (error) {
        console.error('Failed to load article:', error);
        setArticleError('Unable to load article. Please refresh the page.');
        setArticleContent('');
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
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://topaitoolrank.com' },
          { name: 'Tools', url: 'https://topaitoolrank.com/tools' },
          { name: 'AI Prompt Generator', url: 'https://topaitoolrank.com/tools/ai-prompt-generator' },
        ]}
      />
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
      {articleError && (
        <div className={cls(styles, "ai-prompt-generator__article-error")}>
          <p>{articleError}</p>
        </div>
      )}
      {!articleLoading && articleContent && (
        <div className={cls(styles, "ai-prompt-generator__article-container")}>
          <ArticleSection content={articleContent} />
        </div>
      )}
      <FAQSchema
        questions={[
          { q: "What is an AI prompt and how does it differ from a regular question?", a: "A prompt is an instruction to an AI system that goes beyond just asking a question. It includes context, specifies the desired format, defines the tone, and often includes constraints or examples. Regular questions work, but detailed prompts generate much higher quality and more useful responses tailored to your actual needs." },
          { q: "How can I make my AI prompts more effective?", a: "The most effective prompts include specific context (your situation, goals, constraints), clear examples of what you want, details about your audience or use case, and the format you want the response in. Instead of \"write an email,\" try \"write a professional email to a skeptical client explaining why our service will save them money, keep it to three short paragraphs, and use friendly but formal tone.\"" },
          { q: "Why is prompt engineering considered an important skill now?", a: "As AI tools become more integrated into work and creative processes, the ability to get useful outputs from AI determines how much value you extract. Good prompts save hours of manual revision work. Poor prompts produce mediocre results that need significant rework. Developing prompt skills is like developing communication skills\u2014it multiplies your effectiveness with the tool." },
          { q: "What are the best practices for getting consistent, high-quality responses from AI?", a: "Provide examples of the style or format you want, be specific about constraints (length, tone, audience), break complex tasks into smaller prompts, iterate with follow-ups to refine results, and ask the AI to explain its thinking. Treating it as a conversation rather than a one-shot request produces much better long-term outcomes." },
        ]}
      />
    <Footer />
    </>
  );
}

