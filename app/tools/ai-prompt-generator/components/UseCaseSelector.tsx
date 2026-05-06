/**
 * Use Case Selector Component
 * Allows users to select from available prompt templates
 */

import type { Template } from "../lib/templates";
import styles from "../styles.css";

interface Props {
  templates: Template[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function UseCaseSelector({ templates, selected, onSelect }: Props) {
  const selectedTemplate = templates.find((t) => t.id === selected);

  return (
    <div className={styles["ai-prompt-generator__selector-container"]}>
      <div className={styles["ai-prompt-generator__selector-inner"]}>
        <label htmlFor="template-select" className={styles["ai-prompt-generator__label"]}>
          Select a Use Case
        </label>

        <select
          id="template-select"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className={styles["ai-prompt-generator__select"]}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>

        {selectedTemplate && (
          <div className={styles["ai-prompt-generator__template-info"]}>
            <p className={styles["ai-prompt-generator__category"]}>
              {selectedTemplate.category}
            </p>
            <p className={styles["ai-prompt-generator__description"]}>
              {selectedTemplate.description}
            </p>
            <p className={styles["ai-prompt-generator__variable-count"]}>
              {selectedTemplate.variables.length} variable{selectedTemplate.variables.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
