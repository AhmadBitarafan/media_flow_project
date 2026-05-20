import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, filesApi, reviewsApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Timeline } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

export default function CustomerProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revModal, setRevModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [revText, setRevText] = useState('')
  const [review, setReview] = useState({ rating:5, quality_score:5, communication_score:5, timeliness_score:5, comment:'' })
  const [uploading, setUploading] = useState(false)

  const load = () => projectsApi.get(id).then(r => setProject(r.data)).catch(()=>{}).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const handleRevision = async () => {
    if (!revText.trim()) { toast.error('Describe the revision'); return }
    try {
      await projectsApi.requestRevision(id, { description: revText })
      toast.success('Revision requested'); setRevModal(false); setRevText(''); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleApprove = async () => {
    if (!window.confirm('Approve delivery and mark project complete?')) return
    try { await projectsApi.approveDelivery(id); toast.success('Delivery approved!'); load() }
    catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file); fd.append('category', 'project_attachment'); fd.append('project', id)
    try { await filesApi.upload(fd); toast.success('File uploaded'); load() }
    catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleReview = async () => {
    try {
      await reviewsApi.create({ ...review, project: id })
      toast.success('Review submitted!'); setReviewModal(false)
    } catch(e) {
      const d = e.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
    }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>Loading…</div>
  if (!project) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--red)' }}>Project not found</div>

  const timeline = (project.status_history || []).map(h => ({
    time: fmt.datetime(h.created_at),
    title: h.to_status?.replace(/_/g,' '),
    note: [h.note, h.changed_by ? `by ${h.changed_by.full_name}` : ''].filter(Boolean).join(' · '),
    color: h.to_status==='completed' ? 'var(--green)' : h.to_status==='revision' ? 'var(--amber)' : 'var(--accent)',
  }))

  const canRevise = project.can_revise && ['review','in_progress','assigned'].includes(project.status)
  const canApprove = ['review','in_progress'].includes(project.status)
  const isCompleted = project.status === 'completed'

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', marginBottom:'1rem', fontSize:'0.85rem' }}>← Back</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.25rem', fontWeight:700 }}>{project.title}</h1>
          <div style={{ display:'flex', gap:'0.5rem', marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
            <Badge status={project.status} label={project.status_display} />
            {project.required_level && <span style={{ fontSize:'0.74rem', color:'var(--amber)', fontWeight:600 }}>Level {project.required_level.code}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          {canApprove && <Btn variant="success" onClick={handleApprove}>✓ Approve Delivery</Btn>}
          {canRevise && <Btn variant="amber" onClick={() => setRevModal(true)}>↩ Request Revision ({project.revision_count}/{project.max_revisions})</Btn>}
          {isCompleted && !project.review && <Btn variant="secondary" onClick={() => setReviewModal(true)}>⭐ Leave Review</Btn>}
          <label style={{ cursor:'pointer' }}>
            <input type="file" style={{ display:'none' }} onChange={handleUpload} />
            <Btn variant="secondary" loading={uploading} onClick={()=>{}}>📎 Upload File</Btn>
          </label>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {[['Type', project.type_display],['Deadline', project.deadline ? fmt.date(project.deadline) : 'Not set'],['Budget', project.budget ? fmt.currency(project.budget) : 'Not set'],['Revisions', `${project.revision_count}/${project.max_revisions}`]].map(([k,v]) => (
          <Card key={k} style={{ padding:'10px 14px' }}>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k}</p>
            <p style={{ fontWeight:600, marginTop:3, fontSize:'0.875rem' }}>{v}</p>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Description</h3>
            <p style={{ color:'var(--text-sub)', lineHeight:1.7, fontSize:'0.875rem' }}>{project.description}</p>
          </Card>

          {project.current_assignment && (
            <Card>
              <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Assigned Freelancer</h3>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'0.85rem' }}>
                  {project.current_assignment.freelancer?.full_name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{project.current_assignment.freelancer?.full_name}</p>
                  <p style={{ fontSize:'0.76rem', color:'var(--text-muted)' }}>Assigned {fmt.relative(project.current_assignment.created_at)}</p>
                </div>
              </div>
            </Card>
          )}

          {project.revisions?.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Revision History</h3>
              {project.revisions.map(r => (
                <div key={r.id} style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:'0.83rem' }}>Revision #{r.revision_number}</span>
                    <Badge status={r.status} label={r.status} />
                  </div>
                  <p style={{ fontSize:'0.82rem', color:'var(--text-sub)' }}>{r.description}</p>
                  {r.review_notes && <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:4, fontStyle:'italic' }}>Note: {r.review_notes}</p>}
                </div>
              ))}
            </Card>
          )}

          <Card>
            <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Files & Deliverables</h3>
            {!project.files?.length ? (
              <p style={{ color:'var(--text-muted)', fontSize:'0.84rem' }}>No files uploaded yet</p>
            ) : project.files.map(f => (
              <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:4 }}>
                <div>
                  <p style={{ fontSize:'0.85rem', fontWeight:500 }}>📄 {f.original_name}</p>
                  <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{f.category} · {f.size_display} · {f.uploaded_by_name}</p>
                </div>
                <a href={f.url} target="_blank" rel="noreferrer"><Btn size="xs" variant="secondary">↓</Btn></a>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {project.milestones?.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Milestones</h3>
              {project.milestones.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.6rem' }}>
                  <span style={{ fontSize:'0.9rem' }}>{m.status==='completed'?'✅':m.status==='in_progress'?'🔄':'⏳'}</span>
                  <div>
                    <p style={{ fontSize:'0.83rem', fontWeight:500 }}>{m.title}</p>
                    {m.due_date && <p style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>Due {fmt.date(m.due_date)}</p>}
                  </div>
                </div>
              ))}
            </Card>
          )}
          {timeline.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, marginBottom:'0.75rem', fontSize:'0.9rem' }}>Timeline</h3>
              <Timeline items={timeline} />
            </Card>
          )}
        </div>
      </div>

      <Modal open={revModal} onClose={() => setRevModal(false)} title="Request a Revision">
        <Field label="Describe what needs to change" hint={`${project.revision_count} of ${project.max_revisions} revisions used`}>
          <textarea rows={5} value={revText} onChange={e=>setRevText(e.target.value)} placeholder="Be specific about what should be changed…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setRevModal(false)}>Cancel</Btn>
          <Btn onClick={handleRevision}>Submit Revision</Btn>
        </div>
      </Modal>

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Leave a Review">
        {[['rating','Overall Rating'],['quality_score','Quality'],['communication_score','Communication'],['timeliness_score','Timeliness']].map(([k,l]) => (
          <Field key={k} label={l}>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReview(r=>({...r,[k]:n}))}
                  style={{ width:34, height:34, border:`1.5px solid ${review[k]>=n?'var(--amber)':'var(--border)'}`, borderRadius:'var(--radius)', background: review[k]>=n?'var(--amber-bg)':'transparent', color: review[k]>=n?'var(--amber)':'var(--text-muted)', cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>{n}</button>
              ))}
            </div>
          </Field>
        ))}
        <Field label="Comment"><textarea rows={3} value={review.comment} onChange={e=>setReview(r=>({...r,comment:e.target.value}))} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setReviewModal(false)}>Cancel</Btn>
          <Btn variant="success" onClick={handleReview}>Submit Review</Btn>
        </div>
      </Modal>
    </div>
  )
}
