import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, filesApi } from '../../api'
import { Card, PageHeader, Btn, Field } from '../../components/ui'
import { DatePicker } from '../../components/ui/DatePicker'
import toast from 'react-hot-toast'

const TYPES=[
  ['video_production','🎬 Video Production'],['photography','📷 Photography'],
  ['graphic_design','🎨 Graphic Design'],['animation','✨ Animation'],
  ['audio_production','🎵 Audio Production'],['social_media','📱 Social Media'],
  ['branding','🏷️ Branding & Identity'],['web_content','🌐 Web Content'],['other','📦 Other'],
]

const STEPS=['Project Info','Style & Audience','Budget & Files']

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

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.jar', '.app', '.msi', '.py', '.rb', '.php']

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
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

export default function SubmitRequest() {
  const navigate=useNavigate()
  const [step,setStep]=useState(1)
  const [saving,setSaving]=useState(false)
  const [files,setFiles]=useState([])
  const [form,setForm]=useState({
    project_type:'',title:'',description:'',requirements:'',
    budget_min:'',budget_max:'',deadline:'',
    preferred_style:'',target_audience:'',special_constraints:'',sample_references:'',
    max_revisions:'',
  })
  const fv=(k)=>(e)=>setForm(x=>({...x,[k]:e.target.value}))
  const fd=(k)=>(v)=>setForm(x=>({...x,[k]:v}))

  const validate=()=>{
    if(step===1){
      if(!form.project_type){toast.error('Please select a project type');return false}
      if(!form.title.trim()){toast.error('Project title is required');return false}
      if(!form.description.trim()){toast.error('Please describe your project');return false}
      if(!form.requirements.trim()){toast.error('Please list your requirements');return false}
    }
    return true
  }

  const next=()=>{if(validate()) setStep(s=>s+1)}

  const handleSubmit=async()=>{
    setSaving(true)
    try{
      const payload={...form}
      if(!payload.budget_min) delete payload.budget_min
      if(!payload.budget_max) delete payload.budget_max
      if(!payload.deadline)   delete payload.deadline
      if(!payload.max_revisions && payload.max_revisions !== 0) delete payload.max_revisions
      const {data:req}=await projectsApi.createRequest(payload)
      for(const file of files){
        const fd=new FormData()
        fd.append('file',file)
        fd.append('category','project_request')
        fd.append('project_request',req.id)
        await filesApi.upload(fd).catch(()=>{})
      }
      toast.success('Request submitted successfully!')
      navigate('/customer/projects')
    }catch(err){
      const d=err.response?.data
      if(d) Object.entries(d).forEach(([k,v])=>toast.error(`${k}: ${Array.isArray(v)?v[0]:v}`))
      else toast.error('Submission failed. Please try again.')
    }finally{setSaving(false)}
  }

  const addFiles=(newFiles)=>{
    const validFiles = []
    Array.from(newFiles).forEach(file => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
      } else {
        validFiles.push(file)
      }
    })
    setFiles(x=>[...x,...validFiles])
  }
  const removeFile=(i)=>setFiles(x=>x.filter((_,j)=>j!==i))

  return(
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <PageHeader title="Submit Project Request" subtitle="Tell us about your media project and we'll match you with the right freelancer"/>

      {/* Progress steps */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.75rem'}}>
        {STEPS.map((label,i)=>(
          <div key={i} style={{flex:1}}>
            <div style={{height:3,borderRadius:2,marginBottom:5,background:i+1<=step?'var(--accent)':'var(--border)',transition:'background 0.3s'}}/>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:18,height:18,borderRadius:'50%',background:i+1<=step?'var(--accent)':'var(--border)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700,color:'white',flexShrink:0}}>
                {i+1<=step-1?'✓':i+1}
              </span>
              <span style={{fontSize:'0.72rem',fontWeight:500,color:i+1<=step?'var(--accent)':'var(--text-muted)'}}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      <Card>
        {/* STEP 1 */}
        {step===1&&(
          <>
            <Field label="Project Type" required>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginTop:2}}>
                {TYPES.map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(x=>({...x,project_type:v}))}
                    style={{padding:'10px 8px',border:`1.5px solid ${form.project_type===v?'var(--accent)':'var(--border)'}`,borderRadius:'var(--radius)',background:form.project_type===v?'var(--accent-glow)':'transparent',cursor:'pointer',fontSize:'0.78rem',color:form.project_type===v?'var(--accent)':'var(--text-sub)',fontWeight:form.project_type===v?600:400,textAlign:'left',transition:'all 0.15s',fontFamily:'var(--font)'}}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Project Title" required>
              <input value={form.title} onChange={fv('title')} placeholder="e.g. Brand video for product launch campaign"/>
            </Field>
            <Field label="Description" required hint="What do you need? What is the purpose? What should it achieve?">
              <textarea rows={5} value={form.description} onChange={fv('description')} placeholder="Describe your project in detail. The more information you provide, the better match we can find…"/>
            </Field>
            <Field label="Requirements" required hint="Technical specs, deliverable formats, tools, or other must-haves">
              <textarea rows={4} value={form.requirements} onChange={fv('requirements')} placeholder="e.g. 1920×1080 resolution, 60-second video, MP4 format, subtitles required…"/>
            </Field>
          </>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <>
            <Field label="Preferred Style" hint="Describe the look, feel, tone, and aesthetic">
              <textarea rows={3} value={form.preferred_style} onChange={fv('preferred_style')} placeholder="e.g. Cinematic and dramatic, minimalist with white space, bold and energetic, corporate and professional…"/>
            </Field>
            <Field label="Target Audience" hint="Who will see or use this content?">
              <input value={form.target_audience} onChange={fv('target_audience')} placeholder="e.g. Working professionals aged 28–45 in the tech industry"/>
            </Field>
            <Field label="Sample References" hint="Links to work you like, or description of similar projects">
              <textarea rows={3} value={form.sample_references} onChange={fv('sample_references')} placeholder="https://vimeo.com/example&#10;https://youtube.com/example&#10;Or describe: 'Similar to Apple product launch videos'"/>
            </Field>
            <Field label="Special Constraints" hint="Brand guidelines, legal restrictions, languages, do's and don'ts">
              <textarea rows={3} value={form.special_constraints} onChange={fv('special_constraints')} placeholder="e.g. Must use brand colors #FF6B00 and #1A1A2E, no competitor names, must include Arabic subtitles…"/>
            </Field>
          </>
        )}

        {/* STEP 3 */}
        {step===3&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <Field label="Minimum Budget (USD)" hint="Your minimum budget">
                <input type="number" min="0" step="0.01" value={form.budget_min} onChange={fv('budget_min')} placeholder="e.g. 500"/>
              </Field>
              <Field label="Maximum Budget (USD)" hint="Your maximum budget">
                <input type="number" min="0" step="0.01" value={form.budget_max} onChange={fv('budget_max')} placeholder="e.g. 2000"/>
              </Field>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <DatePicker
                label="Project Deadline"
                value={form.deadline}
                onChange={fd('deadline')}
                placeholder="Select your deadline…"
                hint="Supports both Gregorian and Solar Hijri (Shamsi) calendars — click the toggle at the bottom of the picker"
              />
              <Field label="Max Revisions Allowed" hint="How many revision rounds should freelancers be allowed?">
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  value={form.max_revisions} 
                  onChange={e=>setForm(f=>({...f,max_revisions: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))}
                  placeholder="e.g. 3"
                />
              </Field>
            </div>

            <Field label="Attachments" hint="Upload reference images, brand assets, briefs, mood boards (max 50MB each)">
              <div
                style={{border:'1.5px dashed var(--border)',borderRadius:'var(--radius)',padding:'1.5rem',textAlign:'center',cursor:'pointer',transition:'border-color 0.15s, background 0.15s'}}
                onClick={()=>document.getElementById('reqFileInput').click()}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-glow)'}}
                onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}
                onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}
              >
                <input id="reqFileInput" type="file" multiple style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
                <div style={{fontSize:'1.75rem',marginBottom:'0.4rem'}}>📎</div>
                <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>Drag & drop files here, or click to browse</p>
                <p style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:4}}>Images, videos, PDFs, documents — up to 50MB each</p>
              </div>
              {files.length>0&&(
                <div style={{marginTop:'0.75rem',display:'flex',flexDirection:'column',gap:4}}>
                  {files.map((file,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',background:'var(--bg-surface)',borderRadius:'var(--radius)',fontSize:'0.83rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                        <span style={{fontSize:'1rem'}}>📄</span>
                        <span style={{color:'var(--text-sub)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</span>
                        <span style={{color:'var(--text-muted)',flexShrink:0,fontSize:'0.75rem'}}>({(file.size/1024/1024).toFixed(1)}MB)</span>
                      </div>
                      <button onClick={()=>removeFile(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:'1.1rem',lineHeight:1,flexShrink:0,marginLeft:8}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Summary */}
            <div style={{padding:'12px 16px',background:'var(--bg-surface)',borderRadius:'var(--radius)',marginBottom:'0.5rem',fontSize:'0.83rem',color:'var(--text-sub)',lineHeight:1.8}}>
              <strong style={{color:'var(--text)',display:'block',marginBottom:4}}>Summary</strong>
              <span>Type:</span> {TYPES.find(([v])=>v===form.project_type)?.[1] || '—'}<br/>
              <span>Title:</span> {form.title||'—'}<br/>
              {form.deadline&&<><span>Deadline:</span> {form.deadline}<br/></>}
              {(form.budget_min||form.budget_max)&&<><span>Budget:</span> ${form.budget_min||0} – ${form.budget_max||'open'}<br/></>}
              {(form.max_revisions||form.max_revisions===0)&&<><span>Max Revisions:</span> {form.max_revisions}<br/></>}
              {files.length>0&&<><span>Attachments:</span> {files.length} file{files.length!==1?'s':''}</>}
            </div>
          </>
        )}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.25rem',paddingTop:'1.25rem',borderTop:'1px solid var(--border)'}}>
          <Btn variant="secondary" onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1}>← Back</Btn>
          {step<3
            ?<Btn onClick={next}>Next →</Btn>
            :<Btn variant="success" onClick={handleSubmit} loading={saving}>Submit Request ✓</Btn>
          }
        </div>
      </Card>
    </div>
  )
}
