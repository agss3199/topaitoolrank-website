/**
 * Variable Input Component
 * Renders dynamic input fields based on template variables
 */

import type { Template } from "../lib/templates";
import styles from "../styles.css";
import { cls } from "../../lib/css-module-safe";

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
  validation,
}: Props) {
  const handleChange = (name: string, value: string) => {
    onChange({ ...variables, [name]: value });
  };

  return (
    <div className={cls(styles, "ai-prompt-generator__input-container")}>
      <h3 className={cls(styles, "ai-prompt-generator__inputs-title")}>Fill in the Details</h3>

      <div className={cls(styles, "ai-prompt-generator__form")}>
        {template.variables.map((field) => (
          <div key={field.name} className={cls(styles, "ai-prompt-generator__field")}>
            <label htmlFor={field.name} className={cls(styles, "ai-prompt-generator__field-label")}>
              {field.label}
            </label>

            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                value={variables[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={cls(styles, "ai-prompt-generator__textarea")}
                rows={3}
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                value={variables[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={cls(styles, "ai-prompt-generator__select")}
              >
                <option value="">Select an option...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type="text"
                value={variables[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={cls(styles, "ai-prompt-generator__input")}
              />
            )}

            {variables[field.name] && field.type === "textarea" && (
              <p className={cls(styles, "ai-prompt-generator__field-hint")}>
                {variables[field.name].length} characters
              </p>
            )}
          </div>
        ))}
      </div>

      {!validation.valid && (
        <div className={cls(styles, "ai-prompt-generator__validation-errors")}>
          <p className={cls(styles, "ai-prompt-generator__error-title")}>Please complete the following:</p>
          <ul className={cls(styles, "ai-prompt-generator__error-list")}>
            {validation.errors.map((error, i) => (
              <li key={i} className={cls(styles, "ai-prompt-generator__error-item")}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.valid && (
        <div className={cls(styles, "ai-prompt-generator__success-message")}>
          ✓ All fields complete — prompt is ready to preview
        </div>
      )}
    </div>
  );
}
