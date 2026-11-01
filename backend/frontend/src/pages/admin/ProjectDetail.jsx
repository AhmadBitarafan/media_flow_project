import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, usersApi, filesApi } from '../../api'
import { Card, Badge, Btn, Modal, Field, Timeline } from '../../components/ui'
import { fmt } from '../../utils'
import { DatePicker } from '../../components/ui/DatePicker'
import toast from 'react-hot-toast'

const STATUSES=['pending','assigned','in_progress','review','revision','completed','cancelled','on_hold']

export default function AdminProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [freelancers, setFreelancers] = useState([])
  const [levels, setLevels] = useState([])
  const [bids, setBids] = useState([])
  const [assignModal, setAssignModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [milestoneModal, setMilestoneModal] = useState(false)
  const [form, setForm] = useState({ freelancer_id:'', notes:'', status:'', note:'', title:'', description:'', due_date:'' })

  const load = () => projectsApi.get(id).then(r => setProject(r.data)).catch(()=>{}).finally(() => setLoading(false))
  useEffect(() => {
    load()
    usersApi.adminUsers({ role:'freelancer', is_active:true }).then(r => setFreelancers(r.data.results || r.data)).catch(()=>{})
    usersApi.freelancerLevels().then(r => setLevels(r.data.results || r.data)).catch(()=>{})
    projectsApi.bids(id).then(r => setBids(r.data)).catch(()=>{})
  }, [id])

  const handleAssign = async () => {
    if (!form.freelancer_id) { toast.error('Select a freelancer'); return }
    try { await projectsApi.assign(id, { freelancer_id: form.freelancer_id, notes: form.notes }); toast.success('Assigned!'); setAssignModal(false); load() }
    catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }
  const handleStatus = async () => {
    if (!form.status) { toast.error('Select a status'); return }
    try { await projectsApi.updateStatus(id, { status: form.status, note: form.note }); toast.success('Status updated'); setStatusModal(false); load() }
    catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }
  const handleMilestone = async () => {
    if (!form.title) { toast.error('Title required'); return }
    try { await projectsApi.createMilestone(id, { title: form.title, description: form.description, due_date: form.due_date || null }); toast.success('Milestone added'); setMilestoneModal(false); load() }
    catch { toast.error('Failed') }
  }
  const handleRevisionReview = async (revId, action) => {
    try { await projectsApi.reviewRevision(id, { revision_id: revId, action, notes:'' }); toast.success('Done'); load() }
    catch { toast.error('Failed') }
  }
  const handleAcceptBid = async (freelancerId) => {
    try { await projectsApi.assign(id, { freelancer_id: freelancerId }); toast.success('Bid accepted!'); load() }
    catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>Loading…</div>
  if (!project) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--red)' }}>Not found</div>

  const timeline = (project.status_history || []).map(h => ({
    time: fmt.datetime(h.created_at),
    title: h.to_status?.replace(/_/g,' '),
    note: [h.note, h.changed_by ? `by ${h.changed_by.full_name}` : ''].filter(Boolean).join(' · '),
    color: h.to_status==='completed'?'var(--green)':h.to_status==='revision'?'var(--amber)':'var(--accent)',
  }))

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', marginBottom:'1rem', fontSize:'0.85rem' }}>← Back</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.25rem', fontWeight:700 }}>{project.title}</h1>
          <div style={{ display:'flex', gap:'0.5rem', marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
            <Badge status={project.status} label={project.status_display} />
            {project.required_level && <span style={{ fontSize:'0.74rem', color:'var(--amber)', fontWeight:600 }}>Level {project.required_level.code}</span>}
            <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>Priority {project.priority}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <Btn size="sm" variant="secondary" onClick={() => { setForm(f=>({...f,freelancer_id:'',notes:''})); setAssignModal(true) }}>👤 Assign</Btn>
          <Btn size="sm" variant="secondary" onClick={() => { setForm(f=>({...f,status:'',note:''})); setStatusModal(true) }}>🔄 Status</Btn>
          <Btn size="sm" variant="secondary" onClick={() => { setForm(f=>({...f,title:'',description:'',due_date:''})); setMilestoneModal(true) }}>+ Milestone</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {[['Customer',project.customer?.full_name||'—'],['Freelancer',project.current_assignment?.freelancer?.full_name||'Unassigned'],['Deadline',project.deadline?fmt.date(project.deadline):'—'],['Budget',project.budget?fmt.currency(project.budget):'—']].map(([k,v])=>(
          <Card key={k} style={{ padding:'10px 14px' }}>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k}</p>
            <p style={{ fontWeight:600, marginTop:3, fontSize:'0.875rem' }}>{v}</p>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.25rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Description</h3>
            <p style={{ color:'var(--text-sub)', lineHeight:1.7, fontSize:'0.875rem' }}>{project.description}</p>
            {project.internal_notes && <>
              <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
                <p style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--amber)', marginBottom:4 }}>🔒 Internal Notes</p>
                <p style={{ fontSize:'0.83rem', color:'var(--text-sub)' }}>{project.internal_notes}</p>
              </div>
            </>}
          </Card>

          {project.revisions?.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Revisions ({project.revision_count}/{project.max_revisions})</h3>
              {project.revisions.map(r => (
                <div key={r.id} style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:'0.83rem' }}>Revision #{r.revision_number}</span>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <Badge status={r.status} label={r.status} />
                      {r.status==='requested' && <>
                        <Btn size="xs" variant="success" onClick={() => handleRevisionReview(r.id,'approve')}>Approve</Btn>
                        <Btn size="xs" variant="danger"  onClick={() => handleRevisionReview(r.id,'reject')}>Reject</Btn>
                      </>}
                    </div>
                  </div>
                  <p style={{ fontSize:'0.82rem', color:'var(--text-sub)' }}>{r.description}</p>
                </div>
              ))}
            </Card>
          )}

          {bids.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Freelancer Bids ({bids.length})</h3>
              {bids.map(b => (
                <div key={b.id} style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:'0.83rem' }}>{b.freelancer?.full_name}</p>
                    <p style={{ fontSize:'0.8rem', color:'var(--text-sub)', marginTop:2 }}>{b.cover_letter}</p>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4 }}>
                      {b.proposed_budget?`${fmt.currency(b.proposed_budget)}`:''}
                      {b.estimated_days?` · ${b.estimated_days} days`:''}
                    </p>
                  </div>
                  {b.status==='pending' && <Btn size="xs" variant="success" onClick={() => handleAcceptBid(b.freelancer?.id)}>Accept</Btn>}
                </div>
              ))}
            </Card>
          )}

          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Files</h3>
            {!project.files?.length ? <p style={{ color:'var(--text-muted)', fontSize:'0.84rem' }}>No files</p> :
              project.files.map(f => (
                <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:4 }}>
                  <div>
                    <p style={{ fontSize:'0.85rem', fontWeight:500 }}>📄 {f.original_name}</p>
                    <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{f.category} · {f.size_display} · {f.uploaded_by_name}</p>
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer"><Btn size="xs" variant="secondary">↓</Btn></a>
                </div>
              ))
            }
          </Card>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {project.milestones?.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Milestones</h3>
              {project.milestones.map(m => (
                <div key={m.id} style={{ display:'flex', gap:'0.6rem', marginBottom:'0.6rem', alignItems:'center' }}>
                  <span>{m.status==='completed'?'✅':m.status==='in_progress'?'🔄':'⏳'}</span>
                  <div><p style={{ fontSize:'0.83rem', fontWeight:500 }}>{m.title}</p>{m.due_date && <p style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{fmt.date(m.due_date)}</p>}</div>
                </div>
              ))}
            </Card>
          )}
          {timeline.length > 0 && <Card><h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Timeline</h3><Timeline items={timeline} /></Card>}
        </div>
      </div>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Freelancer">
        <Field label="Freelancer">
          <select value={form.freelancer_id} onChange={e=>setForm(f=>({...f,freelancer_id:e.target.value}))}>
            <option value="">Select…</option>
            {freelancers.filter(u=>u.freelancer_profile?.can_accept_projects).map(u=>(
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — Level {u.freelancer_profile?.level?.code||'?'}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes (optional)"><textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Btn>
          <Btn onClick={handleAssign}>Assign</Btn>
        </div>
      </Modal>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status">
        <Field label="New Status">
          <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
            <option value="">Select…</option>
            {STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </Field>
        <Field label="Note"><textarea rows={3} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn onClick={handleStatus}>Update</Btn>
        </div>
      </Modal>

      <Modal open={milestoneModal} onClose={() => setMilestoneModal(false)} title="Add Milestone">
        <Field label="Title" required><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></Field>
        <Field label="Description"><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></Field>
        <DatePicker label="Due Date" value={form.due_date} onChange={v=>setForm(f=>({...f,due_date:v}))} placeholder="Select due date…" hint="Supports Solar (Jalali) calendar"/>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setMilestoneModal(false)}>Cancel</Btn>
          <Btn onClick={handleMilestone}>Add Milestone</Btn>
        </div>
      </Modal>
    </div>
  )
}
