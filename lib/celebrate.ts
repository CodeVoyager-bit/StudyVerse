// Confetti for real wins only: finishing a task, a focus session, or saving your CGPA.
// canvas-confetti is loaded on first use so it never weighs down page load.
const COLORS = ['#ffd43b', '#ff7ab6', '#5ce3ab', '#2f5bea', '#ff9147']

export const originOf = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
}

export async function celebrate(origin?: { x: number; y: number }, big = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const confetti = (await import('canvas-confetti')).default
  confetti({
    origin: origin ?? { x: 0.5, y: 0.6 },
    particleCount: big ? 170 : 45,
    spread: big ? 110 : 70,
    startVelocity: big ? 48 : 26,
    scalar: big ? 1.1 : 0.85,
    ticks: big ? 220 : 110,
    colors: COLORS,
    disableForReducedMotion: true,
  })
}
