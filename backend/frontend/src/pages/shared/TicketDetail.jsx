import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketsApi, filesApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, Badge, Btn } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Allowed file types for ticket uploads
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

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.jar', '.app', '.msi', '.py', '.rb', '.php']

function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
  }

  // Check file extension
  const fileName = file.name
  const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  
  if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
    return `File type ${fileExt} is not allowed for security reasons.`
  }

  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    return `File type "${file.type}" is not allowed. Allowed types: images, videos, PDFs, documents, and text files.`
  }

  return null
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [internal, setInternal] = useState(false)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const endRef = useRef(null)

  const isSupport = user?.role === 'admin' || user?.role === 'supervisor'

  const load = () => ticketsApi.get(id).then(r => setTicket(r.data)).catch(()=>{}).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [ticket?.messages?.length])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) {
      setFile(null)
      setFileError('')
      return
    }

    const error = validateFile(selectedFile)
    if (error) {
      setFileError(error)
      setFile(null)
      // Reset file input
      e.target.value = ''
    } else {
      setFileError('')
      setFile(selectedFile)
    }
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    if (fileError) {
      toast.error('Please fix file issues before sending.')
      return
    }
    
    setSending(true)
    try {
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('category', 'ticket')
        fd.append('ticket', id)
        const uploadResp = await filesApi.upload(fd)
        if (!uploadResp.data || uploadResp.status !== 201) {
          toast.error('File upload failed')
          setSending(false)
          return
        }
      }
      await ticketsApi.reply(id, { content: reply, is_internal: internal && isSupport })
      setReply('')
      setFile(null)
      setFileError('')
      setInternal(false)
      toast.success('Reply sent')
      load()
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.file?.[0] || 'Failed to send reply'
      toast.error(errMsg)
    }
    finally { setSending(false) }
  }

  const handleStatus = async (status) => {
    try { await ticketsApi.updateStatus(id, { status }); toast.success('Status updated'); load() }
    catch { toast.error('Failed') }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>Loading…</div>
  if (!ticket)  return <div style={{ textAlign:'center', padding:'4rem', color:'var(--red)' }}>Ticket not found</div>

  const statusButtons = isSupport
    ? ['open','in_progress','waiting','resolved','closed']
    : []

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', marginBottom:'1rem', fontSize:'0.85rem' }}>← Back</button>

      {/* Header card */}
      <Card style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.1rem', fontWeight:700 }}>{ticket.subject}</h1>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
              <Badge status={ticket.status} label={ticket.status_display || ticket.status} />
              <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{ticket.category} · {ticket.priority} priority</span>
              <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>Opened {fmt.relative(ticket.created_at)}</span>
            </div>
          </div>
          {statusButtons.length > 0 && (
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {statusButtons.map(s => (
                <Btn key={s} size="xs" variant={ticket.status===s?'primary':'secondary'}
                  onClick={() => handleStatus(s)} style={{ textTransform:'capitalize' }}>
                  {s.replace('_',' ')}
                </Btn>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop:'1rem', padding:'10px 14px', background:'var(--bg-surface)', borderRadius:'var(--radius)', fontSize:'0.875rem', color:'var(--text-sub)', lineHeight:1.7 }}>
          {ticket.description}
        </div>
      </Card>

      {/* Messages */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
        {ticket.messages?.map(msg => {
          const isMe = msg.author?.id === user?.id
          const isInt = msg.is_internal
          if (isInt && !isSupport) return null
          return (
            <div key={msg.id} style={{ display:'flex', flexDirection: isMe?'row-reverse':'row', gap:'0.6rem', alignItems:'flex-start' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.75rem', color:'white', background: isMe?'var(--accent)':'var(--bg-surface)', border:'1px solid var(--border)' }}>
                {msg.author?.full_name?.[0] || '?'}
              </div>
              <div style={{ maxWidth:'76%' }}>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:4, flexDirection: isMe?'row-reverse':'row' }}>
                  <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-sub)' }}>{msg.author?.full_name}</span>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{fmt.relative(msg.created_at)}</span>
                  {isInt && <span style={{ fontSize:'0.68rem', background:'var(--purple-bg)', color:'var(--purple)', padding:'1px 6px', borderRadius:4 }}>Internal</span>}
                </div>
                <div style={{ padding:'10px 14px', lineHeight:1.65, fontSize:'0.875rem', color:'var(--text)', background: isMe?'var(--accent-glow)':'var(--bg-surface)', border:`1px solid ${isMe?'rgba(47,129,247,0.3)':'var(--border)'}`, borderRadius:10, borderTopRightRadius: isMe?2:10, borderTopLeftRadius: isMe?10:2 }}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Reply box */}
      {ticket.status !== 'closed' && (
        <Card>
          <textarea rows={4} value={reply} onChange={e=>setReply(e.target.value)}
            placeholder="Write your reply… (Ctrl+Enter to send)"
            style={{ marginBottom:'0.75rem' }}
            onKeyDown={e => { if (e.key==='Enter' && e.ctrlKey) handleReply() }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ cursor:'pointer', fontSize:'0.82rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                  <input type="file" style={{ display:'none' }} onChange={handleFileChange} />
                  📎 {file ? <span style={{ color:'var(--accent)' }}>{file.name}</span> : 'Attach file'}
                </label>
                {fileError && (
                  <span style={{ fontSize:'0.75rem', color:'var(--red)', marginLeft:4 }}>
                    ❌ {fileError}
                  </span>
                )}
                {file && !fileError && (
                  <span style={{ fontSize:'0.75rem', color:'var(--green)', marginLeft:4 }}>
                    ✓ {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              {isSupport && (
                <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.82rem', color:'var(--text-muted)', cursor:'pointer' }}>
                  <input type="checkbox" checked={internal} onChange={e=>setInternal(e.target.checked)} />
                  Internal note
                </label>
              )}
            </div>
            <Btn onClick={handleReply} loading={sending} disabled={!reply.trim() || !!fileError}>Send Reply</Btn>
          </div>
        </Card>
      )}
      {ticket.status === 'closed' && (
        <div style={{ textAlign:'center', padding:'1rem', color:'var(--text-muted)', fontSize:'0.84rem' }}>
          This ticket is closed. {!isSupport && 'Contact support to reopen it.'}
        </div>
      )}
    </div>
  )
}
