/**
 * Example Component for [Tool Name]
 *
 * ISOLATION: This component is tool-specific.
 * Copy this file and rename to match your component.
 * Do NOT import from shared components/ at project root.
 */

import styles from "../styles.css";

interface ExampleProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Example component showing BEM naming and style usage
 */
export default function Example({ label, value, onChange }: ExampleProps) {
  return (
    <div className={styles["[tool-slug]__field"]}>
      <label className={styles["[tool-slug]__label"]}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles["[tool-slug]__input"]}
        placeholder="Enter text..."
      />
    </div>
  );
}
