import React from 'react'
import { badgeStyle } from '../../utils'

/* ── Spinner ───────────────────────────────────────────────────────────────── */
export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite', display:'block', flexShrink:0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

/* ── Badge ─────────────────────────────────────────────────────────────────── */
export function Badge({ status, label }) {
  return <span style={badgeStyle(status)}>{label || status?.replace(/_/g,' ')}</span>
}

/* ── Card ──────────────────────────────────────────────────────────────────── */
export function Card({ children, style, className, onClick }) {
  return (
    <div className={className} onClick={onClick} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Button ────────────────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
  primary:   { bg:'var(--accent)',   hover:'var(--accent-hover)', color:'#fff',              border:'transparent' },
  success:   { bg:'var(--green)',    hover:'#2ea043',             color:'#fff',              border:'transparent' },
  danger:    { bg:'var(--red)',      hover:'#da3633',             color:'#fff',              border:'transparent' },
  secondary: { bg:'var(--bg-surface)',hover:'var(--bg-hover)',   color:'var(--text)',        border:'var(--border)' },
  ghost:     { bg:'transparent',    hover:'var(--bg-hover)',     color:'var(--text-sub)',    border:'transparent' },
  amber:     { bg:'var(--amber-bg)', hover:'rgba(227,179,65,.25)',color:'var(--amber)',      border:'transparent' },
}
const BTN_SIZES = {
  xs: { padding:'3px 10px', fontSize:'0.72rem', height:'24px' },
  sm: { padding:'5px 12px', fontSize:'0.8rem',  height:'30px' },
  md: { padding:'7px 16px', fontSize:'0.875rem',height:'36px' },
  lg: { padding:'10px 22px',fontSize:'0.95rem', height:'44px' },
}

export function Btn({
  children, onClick, type='button', variant='primary', size='md',
  disabled, loading, style, fullWidth,
}) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary
  const s = BTN_SIZES[size] || BTN_SIZES.md
  const off = disabled || loading
  return (
    <button type={type} onClick={onClick} disabled={off}
      onMouseEnter={e => { if (!off) e.currentTarget.style.background = v.hover }}
      onMouseLeave={e => { if (!off) e.currentTarget.style.background = v.bg }}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        gap:'6px', fontFamily:'var(--font)', fontWeight:600, cursor: off ? 'not-allowed':'pointer',
        border:`1px solid ${v.border}`, borderRadius:'var(--radius)',
        background: v.bg, color: v.color, transition:'background 0.15s',
        opacity: off ? 0.55 : 1, whiteSpace:'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...s, ...style,
      }}
    >
      {loading && <Spinner size={13} color="currentColor" />}
      {children}
    </button>
  )
}

/* ── Input / Field ─────────────────────────────────────────────────────────── */
export function Field({ label, hint, error, required, children }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      {label && (
        <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600,
          color:'var(--text-sub)', marginBottom:'5px' }}>
          {label}{required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
        </label>
      )}
      {children}
      {hint  && <p style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginTop:4 }}>{hint}</p>}
      {error && <p style={{ fontSize:'0.73rem', color:'var(--red)',        marginTop:4 }}>{error}</p>}
    </div>
  )
}

/* ── PageHeader ────────────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      marginBottom:'1.5rem', gap:'1rem', flexWrap:'wrap' }}>
      <div>
        <h1 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text)' }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--text-muted)', marginTop:'3px', fontSize:'0.83rem' }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  )
}

/* ── StatCard ──────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon, accent='var(--accent)' }) {
  return (
    <Card style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
      <div style={{ width:42, height:42, borderRadius:'var(--radius)', flexShrink:0,
        background:`${accent}22`, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:'1.15rem' }}>
        {icon}
      </div>
      <div style={{ minWidth:0 }}>
        <p style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)',
          textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
        <p style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--text)', lineHeight:1.1, marginTop:2 }}>{value ?? '—'}</p>
        {sub && <p style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginTop:2 }}>{sub}</p>}
      </div>
    </Card>
  )
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = '520px' }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(4px)' }} onClick={onClose} />
      <div className="fade-in" style={{ position:'relative', width:'100%', maxWidth:width,
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-lg)',
        maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text)' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none',
            color:'var(--text-muted)', cursor:'pointer', fontSize:'1.1rem',
            lineHeight:1, padding:'2px 6px', borderRadius:4,
            transition:'color 0.1s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}
          >✕</button>
        </div>
        <div style={{ padding:'1.25rem' }}>{children}</div>
      </div>
    </div>
  )
}

/* ── Table ─────────────────────────────────────────────────────────────────── */
export function Table({ cols, rows, loading, empty = 'No records found' }) {
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
      <Spinner size={28} color="var(--accent)" />
    </div>
  )
  if (!rows?.length) return (
    <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
      {empty}
    </div>
  )
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid var(--border)' }}>
            {cols.map((c,i) => (
              <th key={i} style={{ padding:'0.65rem 1rem', textAlign:'left', fontSize:'0.71rem',
                fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase',
                letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}
              style={{ borderBottom:'1px solid var(--border-muted)', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {cols.map((c, ci) => (
                <td key={ci} style={{ padding:'0.75rem 1rem', fontSize:'0.85rem',
                  color:'var(--text)', verticalAlign:'middle',
                  whiteSpace: c.nowrap ? 'nowrap' : 'normal' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Timeline ──────────────────────────────────────────────────────────────── */
export function Timeline({ items }) {
  return (
    <div style={{ position:'relative' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display:'flex', gap:'12px', paddingBottom: i < items.length-1 ? '1.1rem' : 0 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', marginTop:4, flexShrink:0,
              background: item.color || 'var(--accent)',
              border:'2px solid var(--bg-card)', zIndex:1 }} />
            {i < items.length-1 && (
              <div style={{ width:2, flex:1, background:'var(--border)', marginTop:2 }} />
            )}
          </div>
          <div style={{ paddingBottom: i < items.length-1 ? '0.25rem' : 0, minWidth:0 }}>
            <p style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginBottom:2 }}>{item.time}</p>
            <p style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--text)',
              textTransform:'capitalize' }}>{item.title}</p>
            {item.note && <p style={{ fontSize:'0.78rem', color:'var(--text-sub)', marginTop:1 }}>{item.note}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Tabs ──────────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.25rem' }}>
      {tabs.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)}
          style={{ padding:'8px 16px', background:'none', border:'none', cursor:'pointer',
            fontFamily:'var(--font)', fontSize:'0.875rem', fontWeight: active===key ? 600 : 400,
            color: active===key ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: active===key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom:'-1px', transition:'color 0.15s', whiteSpace:'nowrap' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

/* ── Empty ─────────────────────────────────────────────────────────────────── */
export function Empty({ icon='📭', title, message, action }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'0.65rem' }}>{icon}</div>
      <p style={{ fontWeight:600, color:'var(--text)', fontSize:'0.95rem', marginBottom:'0.35rem' }}>{title}</p>
      <p style={{ color:'var(--text-muted)', fontSize:'0.83rem', marginBottom: action ? '1.25rem' : 0 }}>{message}</p>
      {action}
    </div>
  )
}
