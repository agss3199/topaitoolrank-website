/**
 * Template Page Component for Isolated Tools
 *
 * This is a template for creating new tools. Copy this file and customize:
 * 1. Rename [tool-name] to your tool's slug
 * 2. Update metadata with tool description
 * 3. Import your tool-specific components
 * 4. Implement your tool UI within the namespace div
 *
 * IMPORTANT: Import styles from "./styles.css" (your tool's own file)
 * MUST NOT import from shared lib/, components/, utils/ at project root
 */

import styles from "./styles.css";

export default function ToolPage() {
  return (
    <div className={styles["[tool-slug]"]}>
      <header className={styles["[tool-slug]__header"]}>
        <h1>[Tool Name]</h1>
        <p>[Tool description - one sentence]</p>
      </header>

      <main className={styles["[tool-slug]__main"]}>
        {/* Tool UI here */}
      </main>

      <footer className={styles["[tool-slug]__footer"]}>
        <p>
          <small>
            Powered by{" "}
            <a href="/" className={styles["[tool-slug]__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export const metadata = {
  title: "[Tool Name] - Free Online Tool",
  description:
    "[1-2 sentence description of what the tool does. Include keywords. <160 chars.]",
  keywords: "[keyword1, keyword2, keyword3]",
};
