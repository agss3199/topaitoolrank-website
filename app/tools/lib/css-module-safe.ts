/**
 * Safe CSS Module accessor for dynamic client components
 * Falls back to plain class name if CSS Module is not available at runtime
 */
export function cls(
  styles: Record<string, string> | undefined,
  className: string
): string {
  if (!styles || !className) return className || '';
  return styles[className] || className;
}

/**
 * Multiple class names from CSS Module
 */
export function clsx(
  styles: Record<string, string> | undefined,
  ...classNames: string[]
): string {
  return classNames
    .map(cn => cls(styles, cn))
    .filter(Boolean)
    .join(' ');
}
