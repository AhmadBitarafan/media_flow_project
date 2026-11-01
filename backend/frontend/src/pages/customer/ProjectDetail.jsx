import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, filesApi, reviewsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, PageHeader, Badge, Btn, Modal, Field, Timeline } from '../../components/ui'
import { DatePicker, isoToJalali } from '../../components/ui/DatePicker'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Allowed file types for project uploads
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
]

const TYPES=[
  ['video_production','🎬 Video Production'],['photography','📷 Photography'],
  ['graphic_design','🎨 Graphic Design'],['animation','✨ Animation'],
  ['audio_production','🎵 Audio Production'],['social_media','📱 Social Media'],
  ['branding','🏷️ Branding & Identity'],['web_content','🌐 Web Content'],['other','📦 Other'],
]

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.jar', '.app', '.msi', '.py', '.rb', '.php']

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
  }
  const fileName = file.name
  const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
    return `File type ${fileExt} is not allowed for security reasons.`
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    return `File type "${file.type}" is not allowed. Allowed types: images, videos, PDFs, documents, and text files.`
  }
  return null
}

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
  const [uploadError, setUploadError] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    project_type: '',
    title: '',
    description: '',
    requirements: '',
    preferred_style: '',
    target_audience: '',
    special_constraints: '',
    sample_references: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    priority: '',
    max_revisions: '',
    is_public_to_level: false,
  })
  const [editFiles, setEditFiles] = useState([])
  const editFileInputRef = React.useRef(null)
  const { user } = useAuth()

  const load = async () => {
    setLoading(true)
    try {
      const r = await projectsApi.get(id)
      setProject(r.data)
    } catch (e) {
      if (e.response?.status === 404) {
        try {
          const rr = await projectsApi.getRequest(id)
          const req = rr.data || {}
          const mapped = {
            id: req.id,
            title: req.title,
            description: req.description,
            project_type: req.project_type,
            type_display: req.type_display || req.project_type,
            deadline: req.deadline || null,
            budget: req.budget || req.budget_max || req.budget_min || null,
            budget_max: req.budget_max || null,
            budget_min: req.budget_min || null,
            requirements: req.requirements || '',
            sample_references: req.sample_references || '',
            special_constraints: req.special_constraints || '',
            target_audience: req.target_audience || '',
            preferred_style: req.preferred_style || '',
            customer: req.customer || null,
            created_at: req.created_at,
            updated_at: req.updated_at,
            status: req.status || 'submitted',
            status_display: req.status_display || (req.status ? req.status.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Submitted'),
            files: req.attachments || req.files || [],
            milestones: req.milestones || [],
            revisions: req.revisions || [],
            status_history: req.status_history || [],
            current_assignment: req.current_assignment || null,
            revision_count: req.revision_count || 0,
            max_revisions: req.max_revisions || 0,
            can_revise: req.can_revise || false,
            required_level: req.required_level || null,
            priority: req.priority || '',
            is_public_to_level: req.is_public_to_level || false,
            _is_request: true,
          }
          setProject(mapped)
        } catch (e2) {
          setProject(null)
        }
      } else {
        setProject(null)
      }
    } finally {
      setLoading(false)
    }
  }

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

  const handleUploadChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      toast.error(error)
      e.target.value = ''
      return
    }
    
    setUploadError('')
    handleUpload(file)
  }

  const handleUpload = async (file) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', 'project_attachment')
    if (project && project._is_request) fd.append('project_request', id)
    else fd.append('project', id)
    try { 
      await filesApi.upload(fd)
      toast.success('File uploaded')
      load() 
    }
    catch(err) {
      const errMsg = err.response?.data?.error || 'Upload failed'
      toast.error(errMsg)
    }
    finally { setUploading(false) }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return
    try {
      await filesApi.remove(fileId)
      toast.success('File deleted')
      load()
    } catch(err) {
      toast.error('Failed to delete file')
    }
  }

  const fileInputRef = React.useRef(null)

  const triggerFileInput = () => {
    fileInputRef.current?.click()
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

  const openEditModal = () => {
    setEditForm({
      project_type: project.project_type || '',
      title: project.title || '',
      description: project.description || '',
      requirements: project.requirements || '',
      preferred_style: project.preferred_style || '',
      target_audience: project.target_audience || '',
      special_constraints: project.special_constraints || '',
      sample_references: project.sample_references || '',
      budget_min: project.budget_min || project.budget || '',
      budget_max: project.budget_max || '',
      deadline: project.deadline || '',
      priority: project.priority || '',
      max_revisions: project.max_revisions || '',
      is_public_to_level: project.is_public_to_level || false,
    })
    setEditFiles([])
    setEditModal(true)
  }

  const handleSaveProject = async () => {
    if (!editForm.title.trim()) { toast.error('Project title is required'); return }

    setEditLoading(true)
    try {
      const payload = {
        project_type: editForm.project_type || null,
        title: editForm.title,
        description: editForm.description || '',
        requirements: editForm.requirements || '',
        preferred_style: editForm.preferred_style || '',
        target_audience: editForm.target_audience || '',
        special_constraints: editForm.special_constraints || '',
        sample_references: editForm.sample_references || '',
        budget_min: editForm.budget_min || null,
        budget_max: editForm.budget_max || null,
        deadline: editForm.deadline || null,
        priority: editForm.priority || null,
        max_revisions: (editForm.max_revisions === '' || editForm.max_revisions == null) ? null : parseInt(editForm.max_revisions, 10),
        is_public_to_level: editForm.is_public_to_level || false,
      }

      if (project && project._is_request) await projectsApi.updateRequest(id, payload)
      else await projectsApi.update(id, payload)

      // Upload any added files to the project
      for (const f of editFiles) {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('category', 'project_attachment')
        if (project && project._is_request) fd.append('project_request', id)
        else fd.append('project', id)
        // ignore individual upload errors
        // eslint-disable-next-line no-await-in-loop
        await filesApi.upload(fd).catch(() => {})
      }

      toast.success('Project updated!')
      await load()
      setEditModal(false)
    } catch (e) {
      const d = e.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
      else toast.error('Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    try {
      if (project && project._is_request) await projectsApi.removeRequest(id)
      else await projectsApi.remove(id)
      toast.success('Project removed')
      navigate('/customer/projects')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed')
    }
  }

  const addEditFiles = (newFiles) => {
    const valid = []
    Array.from(newFiles).forEach(file => {
      const err = validateFile(file)
      if (err) toast.error(err)
      else valid.push(file)
    })
    setEditFiles(x => [...x, ...valid])
  }

  const removeEditFile = (i) => setEditFiles(x => x.filter((_, j) => j !== i))

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
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
          {canApprove && <Btn variant="success" onClick={handleApprove}>✓ Approve Delivery</Btn>}
          {canRevise && <Btn variant="amber" onClick={() => setRevModal(true)}>↩ Request Revision ({project.revision_count}/{project.max_revisions})</Btn>}
          {isCompleted && !project.review && <Btn variant="secondary" onClick={() => setReviewModal(true)}>⭐ Leave Review</Btn>}
          {project.customer?.id === user?.id && (
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center', }}>
              <Btn variant="secondary" size="sm" onClick={openEditModal} style={{height:"36px"}}>✎ Edit</Btn>
              <Btn
                variant="secondary"
                size="sm"
                style={{
                  minWidth: '120px',
                  color: 'var(--red)',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  height: '36px',
                }}
                onClick={handleDeleteProject}
              >
                🗑 Remove
              </Btn>
            </div>
          )}
          <label style={{ cursor:'pointer' }}>
            <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleUploadChange} />
            <Btn variant="secondary" loading={uploading} onClick={triggerFileInput}>📎 Upload File</Btn>
          </label>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {[
          ['Type', project.type_display || project.project_type],
          ['Deadline', project.deadline ? isoToJalali(project.deadline) : 'Not set'],
          ['Budget', project.budget ? fmt.currency(project.budget) : project.budget_min || project.budget_max ? `${project.budget_min ? fmt.currency(project.budget_min) : ''}${project.budget_min && project.budget_max ? ' – ' : ''}${project.budget_max ? fmt.currency(project.budget_max) : ''}` : 'Not set'],
          ['Revisions', `${project.revision_count || 0}/${project.max_revisions || 0}`],
        ].map(([k,v]) => (
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
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'0.85rem', fontWeight:500 }}>📄 {f.original_name}</p>
                  <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{f.category} · {f.size_display} · {f.uploaded_by_name}</p>
                </div>
                <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                  <a href={f.url} target="_blank" rel="noreferrer"><Btn size="xs" variant="secondary">↓</Btn></a>
                  <Btn size="xs" variant="danger" onClick={() => handleDeleteFile(f.id)}>✕</Btn>
                </div>
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

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project">
        <Field label="Project Type" required>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginTop:6}}>
            {TYPES.map(([v,l])=>(
              <button key={v} onClick={()=>setEditForm(x=>({...x,project_type:v}))}
                style={{padding:'10px 8px',border:`1.5px solid ${editForm.project_type===v?'var(--accent)':'var(--border)'}`,borderRadius:'var(--radius)',background:editForm.project_type===v?'var(--accent-glow)':'transparent',cursor:'pointer',fontSize:'0.78rem',color:editForm.project_type===v?'var(--accent)':'var(--text-sub)',fontWeight:editForm.project_type===v?600:400,textAlign:'left',transition:'all 0.15s',fontFamily:'var(--font)'}}>
                {l}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Project Title" required>
          <input value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Brand video for product launch" />
        </Field>

        <Field label="Description" required>
          <textarea rows={5} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="Describe your project in detail" />
        </Field>

        <Field label="Requirements" required hint="Technical specs, deliverable formats, tools, or other must-haves">
          <textarea rows={3} value={editForm.requirements} onChange={e=>setEditForm(f=>({...f,requirements:e.target.value}))} placeholder="e.g. 1920×1080, MP4, subtitles" />
        </Field>

        <Field label="Preferred Style" hint="Look, feel and tone">
          <textarea rows={3} value={editForm.preferred_style} onChange={e=>setEditForm(f=>({...f,preferred_style:e.target.value}))} />
        </Field>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <Field label="Target Audience">
            <input value={editForm.target_audience} onChange={e=>setEditForm(f=>({...f,target_audience:e.target.value}))} />
          </Field>
          <Field label="Max Revisions" hint={project._is_request ? 'Limits revisions when this request is converted to a project.' : 'Total allowed revision rounds for the project.'}>
            <input
              type="number"
              min={0}
              value={editForm.max_revisions}
              onChange={e=>setEditForm(f=>({...f,max_revisions: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))}
              onBlur={e=>{
                const v = e.target.value
                setEditForm(f=>({...f, max_revisions: v === '' ? '' : parseInt(v,10)}))
              }}
            />
          </Field>
        </div>

        <Field label="Special Constraints">
          <textarea rows={2} value={editForm.special_constraints} onChange={e=>setEditForm(f=>({...f,special_constraints:e.target.value}))} />
        </Field>

        <Field label="Sample References">
          <textarea rows={2} value={editForm.sample_references} onChange={e=>setEditForm(f=>({...f,sample_references:e.target.value}))} placeholder="Links or short notes" />
        </Field>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <Field label="Minimum Budget (USD)">
            <input type="number" min={0} value={editForm.budget_min} onChange={e=>setEditForm(f=>({...f,budget_min:e.target.value}))} />
          </Field>
          <Field label="Maximum Budget (USD)">
            <input type="number" min={0} value={editForm.budget_max} onChange={e=>setEditForm(f=>({...f,budget_max:e.target.value}))} />
          </Field>
        </div>

        <DatePicker label="Project Deadline" value={editForm.deadline} onChange={d=>setEditForm(f=>({...f,deadline:d}))} />

        <Field label="Attachments" hint="Add files for this project (images, briefs, references)">
          <div
            style={{border:'1.5px dashed var(--border)',borderRadius:'var(--radius)',padding:'1rem',textAlign:'center',cursor:'pointer'}}
            onClick={()=>editFileInputRef.current?.click()}
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-glow)'}}
            onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}
            onDrop={e=>{e.preventDefault();addEditFiles(e.dataTransfer.files);e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}
          >
            <input ref={editFileInputRef} type="file" multiple style={{display:'none'}} onChange={e=>addEditFiles(e.target.files)} />
            <div style={{fontSize:'1.5rem'}}>📎</div>
            <div style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>Drag & drop files here, or click to browse</div>
          </div>

          {editFiles.length>0 && (
            <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:6}}>
              {editFiles.map((f,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'var(--bg-surface)',borderRadius:'var(--radius)'}}>
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                  <button onClick={()=>removeEditFile(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer'}}>×</button>
                </div>
              ))}
            </div>
          )}

          {project.files?.length>0 && (
            <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:6}}>
              {project.files.map(f=> (
                <div key={f.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'var(--bg-surface)',borderRadius:'var(--radius)'}}>
                  <div style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.original_name}</div>
                  <div style={{display:'flex',gap:8}}>
                    <a href={f.url} target="_blank" rel="noreferrer"><Btn size="xs" variant="secondary">↓</Btn></a>
                    <Btn size="xs" variant="danger" onClick={() => handleDeleteFile(f.id)}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Field>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setEditModal(false)}>Cancel</Btn>
          <Btn loading={editLoading} onClick={handleSaveProject}>Save Changes</Btn>
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
