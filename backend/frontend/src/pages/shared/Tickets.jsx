import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ticketsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, PageHeader, Badge, Btn, Modal, Field, Empty } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

const PRIORITY_DOT = { low:'var(--text-muted)', medium:'var(--accent)', high:'var(--amber)', urgent:'var(--red)' }

export default function TicketsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const base = location.pathname.replace(/\/tickets.*/, '')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ subject:'', description:'', category:'general', priority:'medium' })

  const load = () => ticketsApi.list(statusFilter ? { status: statusFilter } : {})
    .then(r => setTickets(r.data.results || r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [statusFilter])

  const handleCreate = async () => {
    if (!form.subject || !form.description) { toast.error('Subject and description required'); return }
    try {
      await ticketsApi.create(form)
      toast.success('Ticket created')
      setModal(false)
      setForm({ subject:'', description:'', category:'general', priority:'medium' })
      load()
    } catch { toast.error('Failed') }
  }

  const open   = tickets.filter(t => ['open','in_progress','waiting'].includes(t.status)).length
  const closed = tickets.filter(t => ['resolved','closed'].includes(t.status)).length

  return (
    <div>
      <PageHeader title="Support Tickets"
        subtitle={`${open} open · ${closed} resolved`}
        action={<Btn onClick={() => setModal(true)}>+ New Ticket</Btn>} />

      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ maxWidth:180 }}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'3rem' }}>Loading…</p> :
        tickets.length === 0 ? (
          <Empty icon="🎫" title="No tickets" message="Submit a support request if you need help."
            action={<Btn onClick={() => setModal(true)} style={{ marginTop:8 }}>Create Ticket</Btn>} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {tickets.map(t => (
              <Link key={t.id} to={`${base}/tickets/${t.id}`} style={{ textDecoration:'none' }}>
                <Card style={{ padding:'12px 16px', cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:3 }}>
                        <span style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>{t.subject}</span>
                        <Badge status={t.status} label={t.status_display || t.status} />
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.72rem', fontWeight:600, color: PRIORITY_DOT[t.priority] }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: PRIORITY_DOT[t.priority], display:'inline-block' }} />
                          {t.priority}
                        </span>
                      </div>
                      <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</p>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'right', flexShrink:0 }}>
                      <p>{fmt.relative(t.updated_at || t.created_at)}</p>
                      <p style={{ marginTop:2 }}>{t.message_count ?? 0} replies</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      }

      <Modal open={modal} onClose={() => setModal(false)} title="New Support Ticket">
        <Field label="Subject" required>
          <input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="Brief description of your issue…" />
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Field label="Category">
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              <option value="general">General Support</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical Issue</option>
              <option value="project">Project Related</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
        <Field label="Description" required>
          <textarea rows={5} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe your issue in detail…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={handleCreate}>Submit Ticket</Btn>
        </div>
      </Modal>
    </div>
  )
}
