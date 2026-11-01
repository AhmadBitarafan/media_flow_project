import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, usersApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Table } from '../../components/ui'
import { DatePicker } from '../../components/ui/DatePicker'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

const TYPES = [['video_production', '🎬 تولید ویدئو'], ['photography', '📷 عکاسی'],
['graphic_design', '🎨 طراحی گرافیک'], ['animation', '✨ انیمیشن'],
['audio_production', '🎵 تولید صدا'], ['social_media', '📱 شبکه‌های اجتماعی'],
['branding', '🏷️ برندینگ و هویت'], ['web_content', '🌐 محتوای وب'], ['other', '📦 سایر']]
const PRI = ['', '🔴 بحرانی', '🟠 بالا', '🟡 عادی', '🔵 کم', '⚪ حداقلی']

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', project_type: 'video_production', customer_id: '', required_level_id: '', budget: '', deadline: '', priority: '3', max_revisions: '3', is_public_to_level: false, internal_notes: '', assignment_mode: 'manual' })
  const fv = (k) => (e) => setForm(x => ({ ...x, [k]: e.target.value }))
  const fd = (k) => (v) => setForm(x => ({ ...x, [k]: v }))

  const load = () => projectsApi.list().then(r => setProjects(r.data.results || r.data)).finally(() => setLoading(false))
  useEffect(() => {
    load()
    usersApi.adminUsers({ role: 'customer' }).then(r => setCustomers(r.data.results || r.data)).catch(() => { })
    usersApi.freelancerLevels().then(r => setLevels(r.data.results || r.data)).catch(() => { })
  }, [])

  const filtered = projects.filter(p => (!search || p.title?.toLowerCase().includes(search.toLowerCase())) && (!statusFilter || p.status === statusFilter))

  const resetForm = () => setForm({ title: '', description: '', project_type: 'video_production', customer_id: '', required_level_id: '', budget: '', deadline: '', priority: '3', max_revisions: '3', is_public_to_level: false, internal_notes: '', assignment_mode: 'manual' })

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('عنوان پروژه لازم است'); return }
    if (!form.description.trim()) { toast.error('توضیحات پروژه لازم است'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.budget) delete payload.budget
      if (!payload.deadline) delete payload.deadline
      if (!payload.customer_id) delete payload.customer_id
      if (!payload.required_level_id) delete payload.required_level_id
      payload.priority = parseInt(payload.priority)
      payload.max_revisions = parseInt(payload.max_revisions)
      await projectsApi.create(payload)
      toast.success('پروژه ایجاد شد')
      setModal(false); resetForm(); load()
    } catch (err) {
      const d = err.response?.data
      if (d) Object.entries(d).forEach(([k, v]) => toast.error(`${k}: ${Array.isArray(v) ? v[0] : v}`))
      else toast.error('ایجاد پروژه ناموفق بود')
    } finally { setSaving(false) }
  }

  const cols = [
    { label: 'عنوان', render: p => <Link to={`/admin/projects/${p.id}`} style={{ fontWeight: 600, color: 'var(--accent)' }}>{p.title}</Link> },
    { label: 'مشتری', render: p => p.customer?.full_name || '—' },
    { label: 'وضعیت', render: p => <Badge status={p.status} label={p.status_display} /> },
    { label: 'اولویت', render: p => PRI[p.priority] || p.priority, nowrap: true },
    { label: 'فریلنسر', render: p => p.current_assignment?.freelancer?.full_name || <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>تخصیص‌داده نشده</span> },
    { label: 'مهلت', render: p => p.deadline ? fmt.date(p.deadline) : '—', nowrap: true },
    { label: 'ایجاد', render: p => fmt.relative(p.created_at), nowrap: true },
    { label: '', render: p => <Link to={`/admin/projects/${p.id}`}><Btn size="xs" variant="ghost">مشاهده →</Btn></Link> },
  ]

  return (
    <div>
      <PageHeader title="پروژه‌ها" subtitle="مدیریت و تخصیص همه پروژه‌های رسانه‌ای"
        action={<Btn onClick={() => { resetForm(); setModal(true) }}>+ ساخت پروژه</Btn>} />
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input placeholder="جستجو بر اساس عنوان…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">همه وضعیت‌ها</option>
          {['pending', 'assigned', 'in_progress', 'review', 'revision', 'completed', 'cancelled', 'on_hold'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <Card style={{ padding: 0 }}><Table cols={cols} rows={filtered} loading={loading} empty="پروژه‌ای پیدا نشد" /></Card>

      <Modal open={modal} onClose={() => setModal(false)} title="ساخت پروژه جدید" width="640px">
        <Field label="عنوان" required><input value={form.title} onChange={fv('title')} placeholder="مثلاً: ویدئوی برندینگ برای کمپین فصل سوم" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="نوع پروژه" required>
            <select value={form.project_type} onChange={fv('project_type')}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="حالت تخصیص">
            <select value={form.assignment_mode} onChange={fv('assignment_mode')}>
              <option value="manual">دستی (مدیر تخصیص می‌دهد)</option>
              <option value="open">باز برای پیشنهاد فریلنسرها</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="مشتری" hint="اگر خالی بگذارید، به خودتان اختصاص می‌یابد">
            <select value={form.customer_id} onChange={fv('customer_id')}>
              <option value="">— خودتان (بدون مشتری) —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>)}
            </select>
          </Field>
          <Field label="سطح موردنیاز فریلنسر">
            <select value={form.required_level_id} onChange={fv('required_level_id')}>
              <option value="">هر سطحی</option>
              {levels?.map(l => <option key={l.id} value={l.id}>سطح {l.code} — {l.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <Field label="بودجه (دلار)"><input type="number" min="0" step="0.01" value={form.budget} onChange={fv('budget')} placeholder="0.00" /></Field>
          <Field label="اولویت">
            <select value={form.priority} onChange={fv('priority')}>
              <option value="1">1 — بحرانی 🔴</option>
              <option value="2">2 — بالا 🟠</option>
              <option value="3">3 — عادی 🟡</option>
              <option value="4">4 — کم 🔵</option>
              <option value="5">5 — حداقلی ⚪</option>
            </select>
          </Field>
          <Field label="حداکثر بازبینی‌ها">
            <select value={form.max_revisions} onChange={fv('max_revisions')}>
              {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <DatePicker label="مهلت" value={form.deadline} onChange={fd('deadline')}
          placeholder="مهلت را انتخاب کنید…" hint="برای تغییر به تقویم شمسی روی «نمایش تقویم شمسی» کلیک کنید" />

        <Field label="توضیحات" required>
          <textarea rows={4} value={form.description} onChange={fv('description')} placeholder="محدوده و اهداف پروژه را توضیح دهید…" />
        </Field>
        <Field label="یادداشت‌های داخلی" hint="فقط برای مدیران و سرپرستان قابل دیدن است">
          <textarea rows={2} value={form.internal_notes} onChange={fv('internal_notes')} placeholder="یادداشت‌هایی برای تیم داخلی…" />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <label style={{ flex: 1, display: 'flex', justifyContent: 'space-between', flexFlow: 'row-reverse', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-sub)' }}>
            <input style={{
              flexShrink: 0,
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              width: '50px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }} type="checkbox" checked={form.is_public_to_level} onChange={e => setForm(x => ({ ...x, is_public_to_level: e.target.checked }))} />
            <p> برای فریلنسرهای واجد شرایط برای پیشنهاد قابل رویت است</p>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>انصراف</Btn>
          <Btn onClick={handleCreate} loading={saving}>ساخت پروژه</Btn>
        </div>
      </Modal>
    </div>
  )
}
