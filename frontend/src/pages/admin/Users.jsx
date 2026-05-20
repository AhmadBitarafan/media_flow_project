import React, { useState, useEffect } from 'react'
import { usersApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Table } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [verifyModal, setVerifyModal] = useState(false)
  const [levelModal, setLevelModal] = useState(false)
  const [levels, setLevels] = useState([])
  const [form, setForm] = useState({ action:'approve', notes:'', level_id:'' })

  const load = (p={}) => {
    if (search) p.search = search
    if (roleFilter) p.role = roleFilter
    usersApi.adminUsers(p).then(r => setUsers(r.data.results || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load(); usersApi.freelancerLevels().then(r => setLevels(r.data.results || r.data)).catch(()=>{}) }, [])

  const handleToggle = async (u) => {
    try { await usersApi.toggleActive(u.id); toast.success('Status updated'); load() }
    catch { toast.error('Failed') }
  }
  const handleVerify = async () => {
    try { await usersApi.verifyFreelancer(selected.id, { action: form.action, notes: form.notes }); toast.success('Done'); setVerifyModal(false); load() }
    catch { toast.error('Failed') }
  }
  const handleLevel = async () => {
    if (!form.level_id) { toast.error('Select a level'); return }
    try { await usersApi.setFreelancerLevel(selected.id, { level_id: form.level_id }); toast.success('Level updated'); setLevelModal(false); load() }
    catch { toast.error('Failed') }
  }

  const cols = [
    { label:'Name', render: u => (
      <div>
        <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.first_name} {u.last_name}</p>
        <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{u.email}</p>
      </div>
    )},
    { label:'Role',         render: u => <Badge status={u.role} label={u.role} /> },
    { label:'Level',        render: u => u.freelancer_profile?.level?.code ? <span style={{ fontWeight:600, color:'var(--amber)' }}>Level {u.freelancer_profile.level.code}</span> : '—' },
    { label:'Active',       render: u => <span style={{ fontWeight:600, fontSize:'0.8rem', color: u.is_active?'var(--green)':'var(--red)' }}>{u.is_active?'Active':'Disabled'}</span> },
    { label:'Verification', render: u => u.freelancer_profile ? <Badge status={u.freelancer_profile.verification_status} label={u.freelancer_profile.verification_status} /> : '—' },
    { label:'Joined',       render: u => fmt.date(u.date_joined), nowrap:true },
    { label:'', render: u => (
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        <Btn size="xs" variant="ghost" onClick={() => handleToggle(u)}>{u.is_active?'Disable':'Enable'}</Btn>
        {u.role==='freelancer' && <>
          <Btn size="xs" variant="secondary" onClick={() => { setSelected(u); setForm(f=>({...f,action:'approve',notes:''})); setVerifyModal(true) }}>Verify</Btn>
          <Btn size="xs" variant="ghost" onClick={() => { setSelected(u); setForm(f=>({...f,level_id:''})); setLevelModal(true) }}>Level</Btn>
        </>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage customers, freelancers, and team members" />
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:260 }} />
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ maxWidth:160 }}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="freelancer">Freelancer</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        <Btn size="sm" variant="secondary" onClick={() => load()}>Search</Btn>
      </div>
      <Card style={{ padding:0 }}>
        <Table cols={cols} rows={users} loading={loading} empty="No users found" />
      </Card>

      <Modal open={verifyModal} onClose={() => setVerifyModal(false)} title={`Verify: ${selected?.first_name} ${selected?.last_name}`}>
        <div style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:'1rem', fontSize:'0.83rem', color:'var(--text-sub)', lineHeight:1.8 }}>
          <strong>Email:</strong> {selected?.email}<br/>
          <strong>Status:</strong> {selected?.freelancer_profile?.verification_status}<br/>
          <strong>Rating:</strong> {selected?.freelancer_profile?.average_rating || 'N/A'}
        </div>
        <Field label="Decision">
          <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))}>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="suspend">Suspend</option>
          </select>
        </Field>
        <Field label="Notes"><textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setVerifyModal(false)}>Cancel</Btn>
          <Btn variant={form.action==='approve'?'success':'danger'} onClick={handleVerify}>Confirm</Btn>
        </div>
      </Modal>

      <Modal open={levelModal} onClose={() => setLevelModal(false)} title="Set Freelancer Level">
        <Field label="Quality Level">
          <select value={form.level_id} onChange={e=>setForm(f=>({...f,level_id:e.target.value}))}>
            <option value="">Select level…</option>
            {levels?.map(l=><option key={l.id} value={l.id}>Level {l.code} — {l.name} (min rating: {l.min_rating})</option>)}
          </select>
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setLevelModal(false)}>Cancel</Btn>
          <Btn onClick={handleLevel}>Set Level</Btn>
        </div>
      </Modal>
    </div>
  )
}
