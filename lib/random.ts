/** Random integer in [0, n). Lives outside components so the React purity lint stays happy. */
export const randomIndex = (n: number) => Math.floor(Math.random() * n)
