interface FieldSchema {
  type: 'number' | 'string' | 'boolean' | 'select' | 'multiselect'
  label: string
  min?: number
  max?: number
  options?: string[]
  unit?: string
}

interface ConfigFieldProps {
  fieldKey: string
  schema: FieldSchema
  value: string | number | boolean | string[]
  onChange: (key: string, value: string | number | boolean) => void
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  padding: '7px 0', borderBottom: '1px solid var(--ink-700)',
}
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-300)',
  textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
}
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-100)',
  background: 'transparent', border: 'none', outline: 'none',
  textAlign: 'right', maxWidth: 160,
}
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

export default function ConfigField({ fieldKey, schema, value, onChange }: ConfigFieldProps) {
  if (schema.type === 'boolean') {
    return (
      <div style={rowStyle}>
        <span style={labelStyle}>{schema.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(fieldKey, e.target.checked)}
          style={{ accentColor: 'var(--electric)', cursor: 'pointer' }}
        />
      </div>
    )
  }

  if (schema.type === 'select') {
    return (
      <div style={rowStyle}>
        <span style={labelStyle}>{schema.label}</span>
        <select
          value={String(value)}
          onChange={e => onChange(fieldKey, e.target.value)}
          style={{ ...selectStyle, background: 'var(--ink-800)', borderRadius: 2, padding: '1px 4px', border: '1px solid var(--ink-700)', color: 'var(--ink-100)' }}
        >
          {schema.options?.map(opt => <option key={opt} value={opt} style={{ background: 'var(--ink-800)' }}>{opt}</option>)}
        </select>
      </div>
    )
  }

  if (schema.type === 'number') {
    return (
      <div style={rowStyle}>
        <span style={labelStyle}>{schema.label}</span>
        <input
          type="number"
          value={Number(value)}
          min={schema.min}
          max={schema.max}
          onChange={e => onChange(fieldKey, Number(e.target.value))}
          style={inputStyle}
        />
      </div>
    )
  }

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{schema.label}</span>
      <input
        type="text"
        value={String(value)}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={schema.unit ?? ''}
        style={{ ...inputStyle, color: value ? 'var(--ink-100)' : 'var(--ink-500)' }}
      />
    </div>
  )
}
