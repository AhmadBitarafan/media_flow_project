import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, filesApi } from '../../api'
import { Card, Badge, Btn, Modal, Field, Timeline } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 50 * 1024 * 1024
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
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.jar', '.app', '.msi', '.py', '.rb', '.php']

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return `حجم فایل بیش از حد مجاز است. حداکثر حجم مجاز ۵۰ مگابایت است. حجم فایل شما ${(file.size / (1024 * 1024)).toFixed(1)} مگابایت است.`
  }
  const fileName = file.name
  const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
    return `نوع فایل ${fileExt} به دلایل امنیتی مجاز نیست.`
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    return `نوع فایل «${file.type}» مجاز نیست. انواع مجاز: تصاویر، ویدئوها، PDF، اسناد و فایل‌های متنی.`
  }
  return null
}

export default function FreelancerProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bidModal, setBidModal] = useState(false)
  const [bid, setBid] = useState({ cover_letter:'', proposed_budget:'', estimated_days:'' })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = () => projectsApi.get(id).then(r => setProject(r.data)).catch(()=>{}).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const myAssignment = project?.current_assignment
  const isPending = myAssignment?.status === 'assigned'
  const isActive = myAssignment?.status === 'active'
  const isOpen = project?.is_public_to_level && project?.status === 'pending' && !myAssignment

  const handleAccept = async () => {
    try { await projectsApi.acceptAssignment(id); toast.success('پذیرش پروژه انجام شد'); load() }
    catch(e) { toast.error(e.response?.data?.error || 'ناموفق') }
  }
  const handleDecline = async () => {
    if (!window.confirm('این واگذاری را رد می‌کنید؟')) return
    try { await projectsApi.declineAssignment(id); toast.success('رد شد'); navigate('/freelancer/projects') }
    catch(e) { toast.error(e.response?.data?.error || 'ناموفق') }
  }
  const handleStatus = async (status) => {
    try { await projectsApi.updateStatus(id, { status }); toast.success(`وضعیت: ${status}`); load() }
    catch(e) { toast.error(e.response?.data?.error || 'ناموفق') }
  }
  const handleBid = async () => {
    try {
      await projectsApi.bid(id, { ...bid, proposed_budget: bid.proposed_budget || null, estimated_days: bid.estimated_days || null })
      toast.success('پیشنهاد شما ثبت شد'); setBidModal(false); load()
    } catch(e) { toast.error(e.response?.data?.error || 'قبلاً پیشنهاد داده‌اید یا مجاز نیستید') }
  }

  const handleUploadChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const error = validateFile(file)
    if (error) { setUploadError(error); toast.error(error); e.target.value = ''; return }
    setUploadError('')
    handleUpload(file)
  }

  const handleUpload = async (file) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', 'deliverable')
    fd.append('project', id)
    try {
      await filesApi.upload(fd)
      toast.success('تحویل آپلود شد')
      load()
    } catch(err) {
      const errMsg = err.response?.data?.error || 'آپلود ناموفق بود'
      toast.error(errMsg)
    } finally { setUploading(false) }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('این فایل حذف شود؟')) return
    try {
      await filesApi.remove(fileId)
      toast.success('فایل حذف شد')
      load()
    } catch(err) {
      toast.error('حذف ناموفق بود')
    }
  }

  const fileInputRef = React.useRef(null)
  const triggerFileInput = () => { fileInputRef.current?.click() }

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>در حال بارگذاری…</div>
  if (!project) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--red)' }}>پیدا نشد</div>

  const timeline = (project.status_history || []).map(h => ({
    time: fmt.datetime(h.created_at), title: h.to_status?.replace(/_/g,' '), note: h.note,
    color: h.to_status==='completed'?'var(--green)':h.to_status==='revision'?'var(--amber)':'var(--accent)',
  }))

  const pendingRevision = project.revisions?.find(r => r.status === 'requested')

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', marginBottom:'1rem', fontSize:'0.85rem' }}>← بازگشت</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.25rem', fontWeight:700 }}>{project.title}</h1>
          <div style={{ display:'flex', gap:'0.5rem', marginTop:6, alignItems:'center', flexWrap:'wrap' }}>
            <Badge status={project.status} label={project.status_display} />
            {project.required_level && <span style={{ fontSize:'0.74rem', color:'var(--amber)', fontWeight:600 }}>سطح {project.required_level.code}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          {isPending && <>
            <Btn variant="success" onClick={handleAccept}>✓ پذیرش</Btn>
            <Btn variant="danger" onClick={handleDecline}>✗ رد</Btn>
          </>}
          {isActive && project.status === 'assigned' && <Btn onClick={() => handleStatus('in_progress')}>▶ شروع کار</Btn>}
          {isActive && project.status === 'in_progress' && <Btn variant="secondary" onClick={() => handleStatus('review')}>📤 ارسال برای بررسی</Btn>}
          {isActive && project.status === 'revision' && <Btn onClick={() => handleStatus('in_progress')}>🔄 ادامه کار</Btn>}
          {isOpen && <Btn variant="success" onClick={() => setBidModal(true)}>🙋 اعلام آمادگی</Btn>}
          {isActive && (
            <label>
              <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleUploadChange} />
              <Btn variant="secondary" loading={uploading} onClick={triggerFileInput}>📎 آپلود تحویل</Btn>
            </label>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {[['نوع', project.type_display], ['مهلت', project.deadline ? fmt.date(project.deadline) : 'تعریف نشده'], ['بودجه', project.budget ? fmt.currency(project.budget) : 'تعریف نشده']].map(([k,v]) => (
          <Card key={k} style={{ padding:'10px 14px' }}>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k}</p>
            <p style={{ fontWeight:600, marginTop:3, fontSize:'0.875rem' }}>{v}</p>
          </Card>
        ))}
      </div>

      {pendingRevision && (
        <div style={{ padding:'12px 16px', background:'var(--amber-bg)', border:'1px solid rgba(227,179,65,0.4)', borderRadius:'var(--radius-lg)', marginBottom:'1.25rem' }}>
          <p style={{ fontWeight:600, color:'var(--amber)', fontSize:'0.875rem', marginBottom:4 }}>↩ درخواست بازبینی #{pendingRevision.revision_number}</p>
          <p style={{ fontSize:'0.83rem', color:'var(--text-sub)' }}>{pendingRevision.description}</p>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.25rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>توضیحات</h3>
            <p style={{ color:'var(--text-sub)', lineHeight:1.7, fontSize:'0.875rem' }}>{project.description}</p>
          </Card>

          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>فایل‌ها و تحویل‌ها</h3>
            {!project.files?.length ? <p style={{ color:'var(--text-muted)', fontSize:'0.84rem' }}>هنوز فایلی آپلود نشده است</p> :
              project.files.map(f => (
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
              ))
            }
          </Card>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {project.milestones?.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>مراحل</h3>
              {project.milestones.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.6rem' }}>
                  <span>{m.status==='completed'?'✅':m.status==='in_progress'?'🔄':'⏳'}</span>
                  <div>
                    <p style={{ fontSize:'0.83rem', fontWeight:500 }}>{m.title}</p>
                    {m.due_date && <p style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>مهلت: {fmt.date(m.due_date)}</p>}
                  </div>
                </div>
              ))}
            </Card>
          )}
          {timeline.length > 0 && (
            <Card>
              <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>زمان‌بندی</h3>
              <Timeline items={timeline} />
            </Card>
          )}
        </div>
      </div>

      <Modal open={bidModal} onClose={() => setBidModal(false)} title="اعلام آمادگی / پیشنهاد">
        <Field label="نامه‌ی معرفی" hint="چرا بهترین گزینه برای این پروژه هستید؟">
          <textarea rows={4} value={bid.cover_letter} onChange={e=>setBid(b=>({...b,cover_letter:e.target.value}))} placeholder="تجربیات مرتبط خود را توضیح دهید…" />
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <Field label="بودجه پیشنهادی (تومان)"><input type="number" value={bid.proposed_budget} onChange={e=>setBid(b=>({...b,proposed_budget:e.target.value}))} /></Field>
          <Field label="روزهای تخمینی"><input type="number" value={bid.estimated_days} onChange={e=>setBid(b=>({...b,estimated_days:e.target.value}))} /></Field>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setBidModal(false)}>انصراف</Btn>
          <Btn onClick={handleBid}>ثبت پیشنهاد</Btn>
        </div>
      </Modal>
    </div>
  )
}
