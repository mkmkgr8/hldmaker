import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import Anthropic from '@anthropic-ai/sdk'
import { useDesignStore } from '../../store/useDesignStore'
import { useUIStore } from '../../store/useUIStore'
import { serializeDesignForLLM } from '../../utils/serializer'
import type { EvalResult, Severity } from '../../types/schema'

const sevColor: Record<Severity, string> = {
  info:    'var(--info)',
  warning: 'var(--warn)',
  error:   'var(--danger)',
}
const sevLabel: Record<Severity, string> = {
  info:    'info',
  warning: 'tradeoff',
  error:   'bottleneck',
}

export default function EvalPanel() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<EvalResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [streamText, setStreamText] = useState('')

  const { design, setEvaluationResults } = useDesignStore()
  const { setEvalPanelOpen } = useUIStore()
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const runEval = async () => {
    if (!apiKey) { setError('VITE_ANTHROPIC_API_KEY not set. Add it to .env.local and restart.'); return }
    setLoading(true); setError(null); setResults([]); setStreamText('')
    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: `You are evaluating a system design. Analyse it for bottlenecks, single points of failure, missing components, and tradeoffs.\n\nReturn a JSON array of objects: { "severity": "warning"|"info"|"ok", "scope": "node label or edge", "text": "..." }\n\nOnly return the JSON array. No preamble.\n\n${serializeDesignForLLM(design)}` }],
      })
      let accumulated = ''
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          accumulated += chunk.delta.text
          setStreamText(accumulated)
        }
      }
      try {
        const parsed = JSON.parse(accumulated) as Array<{ severity: string; scope: string; text: string }>
        const evalResults: EvalResult[] = parsed.map(r => ({
          severity: (r.severity === 'ok' ? 'info' : r.severity) as Severity,
          scope: r.scope, text: r.text, tier: 3 as const,
        }))
        setResults(evalResults); setEvaluationResults(evalResults)
      } catch { setError('LLM returned invalid JSON.') }
    } catch (e) { setError(e instanceof Error ? e.message : 'Review failed.') }
    finally { setLoading(false) }
  }

  const danger = results.filter(r => r.severity === 'error').length
  const warn = results.filter(r => r.severity === 'warning').length
  const ok = results.filter(r => r.severity === 'info').length

  return (
    <div style={{
      width: 360, display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--ink-900)', borderLeft: '1px solid var(--ink-700)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: 14, borderBottom: '1px solid var(--ink-700)',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink-50)' }}>
            LLM review
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
            Bottlenecks, tradeoffs, open questions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {results.length > 0 && (
            <>
              {danger > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 2, background: 'var(--ink-800)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--danger)' }}>{danger}</span>}
              {warn > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 2, background: 'var(--ink-800)', border: '1px solid rgba(244,162,89,0.25)', color: 'var(--warn)' }}>{warn}</span>}
              {ok > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 2, background: 'var(--ink-800)', border: '1px solid rgba(124,226,157,0.25)', color: 'var(--ok)' }}>{ok}</span>}
            </>
          )}
          <button
            onClick={() => setEvalPanelOpen(false)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-sm)', color: 'var(--ink-400)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--ink-100)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-400)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Run button */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--ink-700)' }}>
        <button
          onClick={runEval}
          disabled={loading || design.canvas.nodes.length === 0}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            padding: '8px 12px', borderRadius: 'var(--r-sm)', border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'var(--ink-800)' : 'var(--electric)',
            color: loading ? 'var(--electric)' : '#08111d',
            transition: 'all 120ms var(--ease)',
            opacity: design.canvas.nodes.length === 0 ? 0.5 : 1,
          }}
        >
          {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Reviewing topology…</> : 'Run review'}
        </button>
        {design.canvas.nodes.length === 0 && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-400)', marginTop: 8, textAlign: 'center' }}>
            Finish the topology, then run review.
          </p>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && (
          <div style={{ background: 'var(--ink-800)', border: '1px solid rgba(255,107,107,0.3)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--r-md)', padding: 14 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>
          </div>
        )}
        {loading && streamText && (
          <div style={{ background: 'var(--ink-800)', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-md)', padding: 14 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-400)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{streamText}</p>
          </div>
        )}
        {results.map((r, i) => {
          const color = sevColor[r.severity]
          return (
            <div key={i} style={{ background: 'var(--ink-800)', border: '1px solid var(--ink-700)', borderLeft: `3px solid ${color}`, borderRadius: 'var(--r-md)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color, flex: 1 }}>{sevLabel[r.severity]}</span>
                {r.scope && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-400)', background: 'var(--ink-900)', border: '1px solid var(--ink-700)', padding: '1px 5px', borderRadius: 2 }}>{r.scope}</span>}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-300)', lineHeight: 1.55 }}>{r.text}</p>
            </div>
          )
        })}
        {!loading && results.length === 0 && !error && (
          <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--ink-800)', border: '1px solid var(--ink-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--ink-500)' }}>?</span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink-100)' }}>No review yet.</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-400)', lineHeight: 1.55, maxWidth: 260 }}>
              Finish the topology, then run review.
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
