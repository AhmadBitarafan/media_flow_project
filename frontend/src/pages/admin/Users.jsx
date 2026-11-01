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
    try { await usersApi.toggleActive(u.id); toast.success('وضعیت به‌روزرسانی شد'); load() }
    catch { toast.error('ناموفق') }
  }
  const handleVerify = async () => {
    try { await usersApi.verifyFreelancer(selected.id, { action: form.action, notes: form.notes }); toast.success('انجام شد'); setVerifyModal(false); load() }
    catch { toast.error('ناموفق') }
  }
  const handleLevel = async () => {
    if (!form.level_id) { toast.error('سطح را انتخاب کنید'); return }
    try { await usersApi.setFreelancerLevel(selected.id, { level_id: form.level_id }); toast.success('سطح به‌روزرسانی شد'); setLevelModal(false); load() }
    catch { toast.error('ناموفق') }
  }

  const cols = [
    { label:'نام', render: u => (
      <div>
        <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.first_name} {u.last_name}</p>
        <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{u.email}</p>
      </div>
    )},
    { label:'نقش',         render: u => <Badge status={u.role} label={u.role} /> },
    { label:'سطح',        render: u => u.freelancer_profile?.level?.code ? <span style={{ fontWeight:600, color:'var(--amber)' }}>سطح {u.freelancer_profile.level.code}</span> : '—' },
    { label:'فعال',       render: u => <span style={{ fontWeight:600, fontSize:'0.8rem', color: u.is_active?'var(--green)':'var(--red)' }}>{u.is_active?'فعال':'غیرفعال'}</span> },
    { label:'تأیید', render: u => u.freelancer_profile ? <Badge status={u.freelancer_profile.verification_status} label={u.freelancer_profile.verification_status} /> : '—' },
    { label:'ثبت‌نام',       render: u => fmt.date(u.date_joined), nowrap:true },
    { label:'', render: u => (
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        <Btn size="xs" variant="ghost" onClick={() => handleToggle(u)}>{u.is_active?'غیرفعال':'فعال'}</Btn>
        {u.role==='freelancer' && <>
          <Btn size="xs" variant="secondary" onClick={() => { setSelected(u); setForm(f=>({...f,action:'approve',notes:''})); setVerifyModal(true) }}>تأیید</Btn>
          <Btn size="xs" variant="ghost" onClick={() => { setSelected(u); setForm(f=>({...f,level_id:''})); setLevelModal(true) }}>سطح</Btn>
        </>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="مدیریت کاربران" subtitle="مدیریت مشتریان، فریلنسرها و اعضای تیم" />
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input placeholder="جستجو نام یا ایمیل…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:260 }} />
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ maxWidth:160 }}>
          <option value="">همه نقش‌ها</option>
          <option value="customer">مشتری</option>
          <option value="freelancer">فریلنسر</option>
          <option value="supervisor">سرپرست</option>
          <option value="admin">مدیر</option>
        </select>
        <Btn size="sm" variant="secondary" onClick={() => load()}>جستجو</Btn>
      </div>
      <Card style={{ padding:0 }}>
        <Table cols={cols} rows={users} loading={loading} empty="کاربری پیدا نشد" />
      </Card>

      <Modal open={verifyModal} onClose={() => setVerifyModal(false)} title={`تأیید: ${selected?.first_name} ${selected?.last_name}`}>
        <div style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', marginBottom:'1rem', fontSize:'0.83rem', color:'var(--text-sub)', lineHeight:1.8 }}>
          <strong>ایمیل:</strong> {selected?.email}<br/>
          <strong>وضعیت:</strong> {selected?.freelancer_profile?.verification_status}<br/>
          <strong>امتیاز:</strong> {selected?.freelancer_profile?.average_rating || 'نامشخص'}
        </div>
        <Field label="تصمیم">
          <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))}>
            <option value="approve">تأیید</option>
            <option value="reject">رد</option>
            <option value="suspend">تعلیق</option>
          </select>
        </Field>
        <Field label="یادداشت‌ها"><textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setVerifyModal(false)}>انصراف</Btn>
          <Btn variant={form.action==='approve'?'success':'danger'} onClick={handleVerify}>تأیید</Btn>
        </div>
      </Modal>

      <Modal open={levelModal} onClose={() => setLevelModal(false)} title="تنظیم سطح فریلنسر">
        <Field label="سطح کیفیت">
          <select value={form.level_id} onChange={e=>setForm(f=>({...f,level_id:e.target.value}))}>
            <option value="">سطح را انتخاب کنید…</option>
            {levels?.map(l=><option key={l.id} value={l.id}>سطح {l.code} — {l.name} (حداقل امتیاز: {l.min_rating})</option>)}
          </select>
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setLevelModal(false)}>انصراف</Btn>
          <Btn onClick={handleLevel}>ثبت سطح</Btn>
        </div>
      </Modal>
    </div>
  )
}
