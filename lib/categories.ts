/** Planner block colours. Content-layer tints only; the accent stays reserved for actions. */
export const CATEGORIES = ['blue', 'green', 'amber', 'rose', 'slate'] as const
export type Category = (typeof CATEGORIES)[number]

export const CAT_TONE: Record<string, string> = {
  blue: 'bg-cat-blue text-cat-blue-ink',
  green: 'bg-cat-green text-cat-green-ink',
  amber: 'bg-cat-amber text-cat-amber-ink',
  rose: 'bg-cat-rose text-cat-rose-ink',
  slate: 'bg-cat-slate text-cat-slate-ink',
}
