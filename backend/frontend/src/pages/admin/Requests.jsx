import React, { useState, useEffect } from 'react'
import { projectsApi, usersApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Table } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [revModal, setRevModal] = useState(false)
  const [convModal, setConvModal] = useState(false)
  const [levels, setLevels] = useState([])
  const [form, setForm] = useState({ action:'approve', notes:'', required_level_id:'' })

  const load = () => projectsApi.listRequests().then(r => setRequests(r.data.results || r.data)).finally(() => setLoading(false))
  useEffect(() => { load(); usersApi.freelancerLevels().then(r => setLevels(r.data.results || r.data)).catch(()=>{}) }, [])

  const handleReview = async () => {
    try {
      await projectsApi.reviewRequest(selected.id, { action: form.action, notes: form.notes })
      toast.success(`Request ${form.action}d`); setRevModal(false); load()
    } catch { toast.error('Action failed') }
  }
  const handleConvert = async () => {
    try {
      await projectsApi.convertRequest(selected.id, { required_level_id: form.required_level_id || null })
      toast.success('Converted to project!'); setConvModal(false); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const cols = [
    { label:'Title',    render: r => <span style={{ fontWeight:500, color:'var(--text)' }}>{r.title}</span> },
    { label:'Customer', render: r => r.customer?.full_name },
    { label:'Type',     render: r => r.type_display },
    { label:'Status',   render: r => <Badge status={r.status} label={r.status_display || r.status} /> },
    { label:'Budget',   render: r => r.budget_max ? fmt.currency(r.budget_max) : '—', nowrap:true },
    { label:'Deadline', render: r => r.deadline ? fmt.date(r.deadline) : '—', nowrap:true },
    { label:'Submitted',render: r => fmt.relative(r.created_at), nowrap:true },
    { label:'', render: r => (
      <div style={{ display:'flex', gap:4 }}>
        {['submitted','under_review'].includes(r.status) && (
          <Btn size="xs" onClick={e=>{e.preventDefault();setSelected(r);setForm({action:'approve',notes:'',required_level_id:''});setRevModal(true)}}>Review</Btn>
        )}
        {r.status==='approved' && (
          <Btn size="xs" variant="success" onClick={e=>{e.preventDefault();setSelected(r);setConvModal(true)}}>→ Project</Btn>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Project Requests" subtitle="Review and process incoming customer requests" />
      <Card style={{ padding:0 }}>
        <Table cols={cols} rows={requests} loading={loading} empty="No requests yet" />
      </Card>

      <Modal open={revModal} onClose={() => setRevModal(false)} title={`Review: ${selected?.title}`}>
        <Field label="Decision">
          <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))}>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </Field>
        <Field label="Notes to customer">
          <textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional message to the customer…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setRevModal(false)}>Cancel</Btn>
          <Btn variant={form.action==='approve'?'success':'danger'} onClick={handleReview}>
            {form.action==='approve' ? '✓ Approve' : '✗ Reject'}
          </Btn>
        </div>
      </Modal>

      <Modal open={convModal} onClose={() => setConvModal(false)} title="Convert to Project">
        <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', marginBottom:'1rem' }}>Creating project: <strong style={{ color:'var(--text)' }}>{selected?.title}</strong></p>
        <Field label="Required Freelancer Level">
          <select value={form.required_level_id} onChange={e=>setForm(f=>({...f,required_level_id:e.target.value}))}>
            <option value="">Any level</option>
            {levels?.map(l => <option key={l.id} value={l.id}>Level {l.code} — {l.name}</option>)}
          </select>
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setConvModal(false)}>Cancel</Btn>
          <Btn variant="success" onClick={handleConvert}>Create Project</Btn>
        </div>
      </Modal>
    </div>
  )
}
