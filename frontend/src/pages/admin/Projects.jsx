import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, usersApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Table } from '../../components/ui'
import { DatePicker } from '../../components/ui/DatePicker'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

const TYPES=[['video_production','Video Production'],['photography','Photography'],
  ['graphic_design','Graphic Design'],['animation','Animation'],
  ['audio_production','Audio Production'],['social_media','Social Media'],
  ['branding','Branding & Identity'],['web_content','Web Content'],['other','Other']]
const PRI=['','🔴 Critical','🟠 High','🟡 Normal','🔵 Low','⚪ Minimal']

export default function AdminProjects() {
  const [projects,setProjects]=useState([])
  const [customers,setCustomers]=useState([])
  const [levels,setLevels]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('')
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({title:'',description:'',project_type:'video_production',customer_id:'',required_level_id:'',budget:'',deadline:'',priority:'3',max_revisions:'3',is_public_to_level:false,internal_notes:'',assignment_mode:'manual'})
  const fv=(k)=>(e)=>setForm(x=>({...x,[k]:e.target.value}))
  const fd=(k)=>(v)=>setForm(x=>({...x,[k]:v}))

  const load=()=>projectsApi.list().then(r=>setProjects(r.data.results||r.data)).finally(()=>setLoading(false))
  useEffect(()=>{
    load()
    usersApi.adminUsers({role:'customer'}).then(r=>setCustomers(r.data.results||r.data)).catch(()=>{})
    usersApi.freelancerLevels().then(r=>setLevels(r.data.results||r.data)).catch(()=>{})
  },[])

  const filtered=projects.filter(p=>(!search||p.title?.toLowerCase().includes(search.toLowerCase()))&&(!statusFilter||p.status===statusFilter))

  const resetForm=()=>setForm({title:'',description:'',project_type:'video_production',customer_id:'',required_level_id:'',budget:'',deadline:'',priority:'3',max_revisions:'3',is_public_to_level:false,internal_notes:'',assignment_mode:'manual'})

  const handleCreate=async()=>{
    if(!form.title.trim()){toast.error('Title is required');return}
    if(!form.description.trim()){toast.error('Description is required');return}
    setSaving(true)
    try{
      const payload={...form}
      if(!payload.budget) delete payload.budget
      if(!payload.deadline) delete payload.deadline
      if(!payload.customer_id) delete payload.customer_id
      if(!payload.required_level_id) delete payload.required_level_id
      payload.priority=parseInt(payload.priority)
      payload.max_revisions=parseInt(payload.max_revisions)
      await projectsApi.create(payload)
      toast.success('Project created!')
      setModal(false); resetForm(); load()
    }catch(err){
      const d=err.response?.data
      if(d) Object.entries(d).forEach(([k,v])=>toast.error(`${k}: ${Array.isArray(v)?v[0]:v}`))
      else toast.error('Failed to create project')
    }finally{setSaving(false)}
  }

  const cols=[
    {label:'Title',render:p=><Link to={`/admin/projects/${p.id}`} style={{fontWeight:600,color:'var(--accent)'}}>{p.title}</Link>},
    {label:'Customer',render:p=>p.customer?.full_name||'—'},
    {label:'Status',render:p=><Badge status={p.status} label={p.status_display}/>},
    {label:'Priority',render:p=>PRI[p.priority]||p.priority,nowrap:true},
    {label:'Freelancer',render:p=>p.current_assignment?.freelancer?.full_name||<span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>Unassigned</span>},
    {label:'Deadline',render:p=>p.deadline?fmt.date(p.deadline):'—',nowrap:true},
    {label:'Created',render:p=>fmt.relative(p.created_at),nowrap:true},
    {label:'',render:p=><Link to={`/admin/projects/${p.id}`}><Btn size="xs" variant="ghost">View →</Btn></Link>},
  ]

  return(
    <div>
      <PageHeader title="Projects" subtitle="Manage and assign all media projects"
        action={<Btn onClick={()=>{resetForm();setModal(true)}}>+ Create Project</Btn>}/>
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',flexWrap:'wrap'}}>
        <input placeholder="Search by title…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}}/>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{maxWidth:180}}>
          <option value="">All statuses</option>
          {['pending','assigned','in_progress','review','revision','completed','cancelled','on_hold'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <Card style={{padding:0}}><Table cols={cols} rows={filtered} loading={loading} empty="No projects found"/></Card>

      <Modal open={modal} onClose={()=>setModal(false)} title="Create New Project" width="640px">
        <Field label="Title" required><input value={form.title} onChange={fv('title')} placeholder="e.g. Brand Video for Q3 Campaign"/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <Field label="Project Type" required>
            <select value={form.project_type} onChange={fv('project_type')}>
              {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Assignment Mode">
            <select value={form.assignment_mode} onChange={fv('assignment_mode')}>
              <option value="manual">Manual (admin assigns)</option>
              <option value="open">Open for freelancer bids</option>
            </select>
          </Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <Field label="Customer" hint="Leave blank to assign to yourself">
            <select value={form.customer_id} onChange={fv('customer_id')}>
              <option value="">— Self (no customer) —</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>)}
            </select>
          </Field>
          <Field label="Required Freelancer Level">
            <select value={form.required_level_id} onChange={fv('required_level_id')}>
              <option value="">Any level</option>
              {levels?.map(l=><option key={l.id} value={l.id}>Level {l.code} — {l.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
          <Field label="Budget (USD)"><input type="number" min="0" step="0.01" value={form.budget} onChange={fv('budget')} placeholder="0.00"/></Field>
          <Field label="Priority">
            <select value={form.priority} onChange={fv('priority')}>
              <option value="1">1 — Critical 🔴</option>
              <option value="2">2 — High 🟠</option>
              <option value="3">3 — Normal 🟡</option>
              <option value="4">4 — Low 🔵</option>
              <option value="5">5 — Minimal ⚪</option>
            </select>
          </Field>
          <Field label="Max Revisions">
            <select value={form.max_revisions} onChange={fv('max_revisions')}>
              {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <DatePicker label="Deadline" value={form.deadline} onChange={fd('deadline')}
          placeholder="Select deadline…" hint="Click 'نمایش تقویم شمسی' to switch to Solar (Jalali) calendar"/>

        <Field label="Description" required>
          <textarea rows={4} value={form.description} onChange={fv('description')} placeholder="Describe the project scope and goals…"/>
        </Field>
        <Field label="Internal Notes" hint="Only visible to admins and supervisors">
          <textarea rows={2} value={form.internal_notes} onChange={fv('internal_notes')} placeholder="Notes for the internal team…"/>
        </Field>
        <label style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1.25rem',cursor:'pointer',fontSize:'0.875rem',color:'var(--text-sub)'}}>
          <input type="checkbox" checked={form.is_public_to_level} onChange={e=>setForm(x=>({...x,is_public_to_level:e.target.checked}))}/>
          Visible to eligible freelancers for bidding
        </label>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
          <Btn variant="secondary" onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn onClick={handleCreate} loading={saving}>Create Project</Btn>
        </div>
      </Modal>
    </div>
  )
}
