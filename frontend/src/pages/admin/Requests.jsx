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
      toast.success(`درخواست ${form.action === 'approve' ? 'تأیید' : 'رد'} شد`); setRevModal(false); load()
    } catch { toast.error('عملیات ناموفق بود') }
  }
  const handleConvert = async () => {
    try {
      await projectsApi.convertRequest(selected.id, { required_level_id: form.required_level_id || null })
      toast.success('به پروژه تبدیل شد'); setConvModal(false); load()
    } catch(e) { toast.error(e.response?.data?.error || 'ناموفق') }
  }

  const cols = [
    { label:'عنوان',    render: r => <span style={{ fontWeight:500, color:'var(--text)' }}>{r.title}</span> },
    { label:'مشتری', render: r => r.customer?.full_name },
    { label:'نوع',     render: r => r.type_display },
    { label:'وضعیت',   render: r => <Badge status={r.status} label={r.status_display || r.status} /> },
    { label:'بودجه',   render: r => r.budget_max ? fmt.currency(r.budget_max) : '—', nowrap:true },
    { label:'مهلت', render: r => r.deadline ? fmt.date(r.deadline) : '—', nowrap:true },
    { label:'ثبت‌شده',render: r => fmt.relative(r.created_at), nowrap:true },
    { label:'', render: r => (
      <div style={{ display:'flex', gap:4 }}>
        {['submitted','under_review'].includes(r.status) && (
          <Btn size="xs" onClick={e=>{e.preventDefault();setSelected(r);setForm({action:'approve',notes:'',required_level_id:''});setRevModal(true)}}>بررسی</Btn>
        )}
        {r.status==='approved' && (
          <Btn size="xs" variant="success" onClick={e=>{e.preventDefault();setSelected(r);setConvModal(true)}}>→ پروژه</Btn>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="درخواست‌های پروژه" subtitle="بررسی و پردازش درخواست‌های ورودی مشتریان" />
      <Card style={{ padding:0 }}>
        <Table cols={cols} rows={requests} loading={loading} empty="هنوز درخواست‌ پروژه‌ای وجود ندارد" />
      </Card>

      <Modal open={revModal} onClose={() => setRevModal(false)} title={`بررسی: ${selected?.title}`}>
        <Field label="تصمیم">
          <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))}>
            <option value="approve">تأیید</option>
            <option value="reject">رد</option>
          </select>
        </Field>
        <Field label="یادداشت برای مشتری">
          <textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="پیام اختیاری برای مشتری…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setRevModal(false)}>انصراف</Btn>
          <Btn variant={form.action==='approve'?'success':'danger'} onClick={handleReview}>
            {form.action==='approve' ? '✓ تأیید' : '✗ رد'}
          </Btn>
        </div>
      </Modal>

      <Modal open={convModal} onClose={() => setConvModal(false)} title="تبدیل به پروژه">
        <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', marginBottom:'1rem' }}>در حال ایجاد پروژه: <strong style={{ color:'var(--text)' }}>{selected?.title}</strong></p>
        <Field label="سطح موردنیاز فریلنسر">
          <select value={form.required_level_id} onChange={e=>setForm(f=>({...f,required_level_id:e.target.value}))}>
            <option value="">هر سطحی</option>
            {levels?.map(l => <option key={l.id} value={l.id}>سطح {l.code} — {l.name}</option>)}
          </select>
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setConvModal(false)}>انصراف</Btn>
          <Btn variant="success" onClick={handleConvert}>ساخت پروژه</Btn>
        </div>
      </Modal>
    </div>
  )
}
