import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { isoToJalali } from '../components/ui/DatePicker'

export const fmt = {
  // Show dates as Shamsi (Jalali) YYYY/MM/DD for users
  date: (d) => {
    try {
      if (!d) return '—'
      const iso = String(d).split('T')[0]
      return isoToJalali(iso)
    } catch { return d || '—' }
  },
  datetime: (d) => {
    try {
      if (!d) return '—'
      const iso = String(d).split('T')[0]
      const time = format(parseISO(d), 'h:mm a')
      return `${isoToJalali(iso)} · ${time}`
    } catch { return d || '—' }
  },
  relative: (d) => { try { return d ? formatDistanceToNow(parseISO(d), { addSuffix: true }) : '—' } catch { return '—' } },
  currency: (n, cur = 'USD') => n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n)
    : '—',
  filesize: (bytes) => {
    if (!bytes) return '0 B'
    const u = ['B','KB','MB','GB']; let i = 0, s = bytes
    while (s >= 1024 && i < 3) { s /= 1024; i++ }
    return `${s.toFixed(1)} ${u[i]}`
  },
}

/* Status → colour mapping */
export const STATUS_COLOR = {
  // Project
  pending: 'amber', assigned: 'accent', in_progress: 'cyan',
  review: 'purple', revision: 'amber', completed: 'green',
  cancelled: 'red', on_hold: 'muted',
  // Request
  draft: 'muted', submitted: 'accent', under_review: 'amber',
  approved: 'green', rejected: 'red', converted: 'purple',
  // Ticket
  open: 'accent', in_progress_t: 'purple', waiting: 'amber',
  resolved: 'green', closed: 'muted',
  // Revision
  requested: 'amber', in_progress_r: 'cyan',
  // Roles
  admin: 'red', supervisor: 'purple', customer: 'accent', freelancer: 'green',
  // Priority
  low: 'muted', medium: 'accent', high: 'amber', urgent: 'red',
}

const C = {
  accent:  { bg: 'var(--accent-glow)',  text: 'var(--accent)'  },
  green:   { bg: 'var(--green-bg)',     text: 'var(--green)'   },
  amber:   { bg: 'var(--amber-bg)',     text: 'var(--amber)'   },
  red:     { bg: 'var(--red-bg)',       text: 'var(--red)'     },
  purple:  { bg: 'var(--purple-bg)',    text: 'var(--purple)'  },
  cyan:    { bg: 'var(--cyan-bg)',      text: 'var(--cyan)'    },
  muted:   { bg: 'rgba(110,118,129,0.15)', text: 'var(--text-sub)' },
}
export const badgeStyle = (status) => {
  const key = STATUS_COLOR[status] || 'muted'
  const { bg, text } = C[key] || C.muted
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: '20px',
    fontSize: '0.72rem', fontWeight: '600',
    background: bg, color: text,
    textTransform: 'capitalize', whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  }
}
