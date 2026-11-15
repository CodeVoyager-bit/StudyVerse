import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY

const MODEL = 'claude-opus-5-5'
const DAILY_LIMIT = 30
export const AI_MAX_CHARS = 100_000

let client: Anthropic | null = null

type Ask = {
  supabase: SupabaseClient
  uid: string
  kind: 'summary' | 'flashcards'
  system: string
  text: string
  schema?: Record<string, unknown>
}

/** One Claude call on the user's own text, capped at DAILY_LIMIT per person per 24 hours. Returns the reply text. */
export async function askClaude({ supabase, uid, kind, system, text, schema }: Ask): Promise<{ error: string } | { text: string }> {
  if (!aiEnabled()) return { error: 'The AI helper isn’t set up on this server.' }
  if (!text.trim()) return { error: 'There’s nothing to work with yet.' }
  if (text.length > AI_MAX_CHARS) return { error: `That’s too long for one go (${AI_MAX_CHARS.toLocaleString()} characters max). Split it into parts.` }

  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { count } = await supabase.from('ai_requests').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return { error: `You’ve used today’s ${DAILY_LIMIT} AI requests. They refill over the next day.` }
  const { error: logError } = await supabase.from('ai_requests').insert({ user_id: uid, kind })
  if (logError) return { error: logError.message }

  client ??= new Anthropic()
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // on a policy decline, the API retries on a suitable fallback model
      output_config: { effort: 'low', ...(schema && { format: { type: 'json_schema', schema } }) },
      system,
      messages: [{ role: 'user', content: `<document>\n${text}\n</document>` }],
    })
    if (res.stop_reason === 'refusal') return { error: 'The AI declined this one. Try different text.' }
    if (res.stop_reason === 'max_tokens') return { error: 'That ran too long. Try a shorter piece.' }
    const out = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim()
    return out ? { text: out } : { error: 'The AI came back empty. Try again.' }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { error: 'The AI is busy right now. Try again in a minute.' }
    if (e instanceof Anthropic.AuthenticationError) return { error: 'The server’s AI key is invalid.' }
    if (e instanceof Anthropic.APIError) return { error: `The AI request failed (${e.status ?? 'network'}). Try again.` }
    throw e
  }
}
