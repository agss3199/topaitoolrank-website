/**
 * Preview Component — WhatsApp Message Formatter
 *
 * Displays the formatted output and statistics
 * Includes copy and download buttons
 */

import styles from "../styles.css";
import { ConversionResult } from "../lib/markdown-to-whatsapp";
import { cls } from "../../lib/css-module-safe";

interface PreviewProps {
  result: ConversionResult;
  isEmptyInput: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
}

export default function Preview({ result, isEmptyInput, onCopy, onDownload }: PreviewProps) {
  const { formatted, patterns } = result;
  const totalPatterns =
    patterns.bold +
    patterns.italic +
    patterns.code +
    patterns.boldItalic +
    patterns.strikethrough +
    patterns.monospace;

  return (
    <div className={cls(styles, "whatsapp-message-formatter__section")}>
      <h2>WhatsApp Preview</h2>

      {isEmptyInput ? (
        <div
          className={`${cls(styles, "whatsapp-message-formatter__preview")} ${cls(styles, "whatsapp-message-formatter__preview-empty")}`}
        >
          Your formatted message will appear here...
        </div>
      ) : (
        <>
          <div className={cls(styles, "whatsapp-message-formatter__preview")}>
            {formatted}
          </div>

          <div className={cls(styles, "whatsapp-message-formatter__stats")}>
            <div className={cls(styles, "whatsapp-message-formatter__stat")}>
              <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                {formatted.length}
              </div>
              <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                Characters
              </div>
            </div>

            <div className={cls(styles, "whatsapp-message-formatter__stat")}>
              <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                {totalPatterns}
              </div>
              <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                Formatting
              </div>
            </div>

            {patterns.bold > 0 && (
              <div className={cls(styles, "whatsapp-message-formatter__stat")}>
                <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                  {patterns.bold}
                </div>
                <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                  Bold
                </div>
              </div>
            )}

            {patterns.italic > 0 && (
              <div className={cls(styles, "whatsapp-message-formatter__stat")}>
                <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                  {patterns.italic}
                </div>
                <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                  Italic
                </div>
              </div>
            )}

            {patterns.code > 0 && (
              <div className={cls(styles, "whatsapp-message-formatter__stat")}>
                <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                  {patterns.code}
                </div>
                <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                  Code
                </div>
              </div>
            )}

            {patterns.strikethrough > 0 && (
              <div className={cls(styles, "whatsapp-message-formatter__stat")}>
                <div className={cls(styles, "whatsapp-message-formatter__stat-value")}>
                  {patterns.strikethrough}
                </div>
                <div className={cls(styles, "whatsapp-message-formatter__stat-label")}>
                  Strikethrough
                </div>
              </div>
            )}

            <div className={cls(styles, "whatsapp-message-formatter__button-group")}>
              <button
                className={cls(styles, "whatsapp-message-formatter__button")}
                onClick={onCopy}
                disabled={isEmptyInput}
                title="Copy formatted message to clipboard"
              >
                📋 Copy
              </button>
              <button
                className={cls(styles, "whatsapp-message-formatter__button")}
                onClick={onDownload}
                disabled={isEmptyInput}
                title="Download formatted message as text file"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
