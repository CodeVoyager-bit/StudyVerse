/** Grade-point tables per scale. */
export const SCALES = {
  '10': { O: 10, 'A+': 9, A: 8.5, 'B+': 8, B: 7, C: 6, P: 5, F: 0 },
  '4': { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, D: 1, F: 0 },
}
export const GRADE_POINTS = SCALES['10']

/** @typedef {{ credits: string | number, grade: string }} Course */

/**
 * Credit-weighted GPA. Blank or unknown rows are ignored; null when nothing to average.
 * @param {Course[]} courses
 * @param {'10' | '4'} [scale]
 * @returns {number | null}
 */
export function gpa(courses, scale = '10') {
  const points = SCALES[scale] ?? SCALES['10']
  let credits = 0
  let total = 0
  for (const c of courses) {
    if (!c.credits || !(c.grade in points)) continue
    credits += Number(c.credits)
    total += Number(c.credits) * points[/** @type {keyof typeof points} */ (c.grade)]
  }
  return credits ? total / credits : null
}
