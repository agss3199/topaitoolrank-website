/**
 * Safe CSS Module accessor for dynamic client components.
 *
 * When using `export const dynamic = 'force-dynamic'` in Next.js,
 * CSS Module styles can be undefined at runtime. This helper provides
 * a safe fallback to prevent "Cannot read properties of undefined" errors.
 *
 * Usage: className={cls(styles, 'my-class')}
 */

export function cls(
  styles: Record<string, string> | undefined,
  className: string
): string {
  if (!styles || !className) {
    return className || '';
  }
  return styles[className] || className;
}
