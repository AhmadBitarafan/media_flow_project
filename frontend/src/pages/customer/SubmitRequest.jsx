import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, filesApi } from '../../api'
import { Card, PageHeader, Btn, Field } from '../../components/ui'
import { DatePicker } from '../../components/ui/DatePicker'
import toast from 'react-hot-toast'

const TYPES = [
  ['video_production', '🎬 تولید ویدئو'], ['photography', '📷 عکاسی'],
  ['graphic_design', '🎨 طراحی گرافیک'], ['animation', '✨ انیمیشن'],
  ['audio_production', '🎵 تولید صدا'], ['social_media', '📱 شبکه‌های اجتماعی'],
  ['branding', '🏷️ برندینگ و هویت'], ['web_content', '🌐 محتوای وب'], ['other', '📦 سایر'],
]

const STEPS = ['اطلاعات پروژه', 'سبک و مخاطب', 'بودجه و فایل‌ها']
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
    return `فایل «${file.name}» بسیار بزرگ است. حداکثر حجم مجاز ۵۰ مگابایت است. حجم فایل شما ${(file.size / (1024 * 1024)).toFixed(1)} مگابایت است.`
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

export default function SubmitRequest() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState([])
  const [form, setForm] = useState({
    project_type: '', title: '', description: '', requirements: '',
    budget_min: '', budget_max: '', deadline: '',
    preferred_style: '', target_audience: '', special_constraints: '', sample_references: '',
    max_revisions: '',
  })
  const fv = (k) => (e) => setForm(x => ({ ...x, [k]: e.target.value }))
  const fd = (k) => (v) => setForm(x => ({ ...x, [k]: v }))

  const validate = () => {
    if (step === 1) {
      if (!form.project_type) { toast.error('لطفاً نوع پروژه را انتخاب کنید'); return false }
      if (!form.title.trim()) { toast.error('عنوان پروژه لازم است'); return false }
      if (!form.description.trim()) { toast.error('لطفاً پروژه را توضیح دهید'); return false }
      if (!form.requirements.trim()) { toast.error('لطفاً نیازمندی‌های پروژه را ذکر کنید'); return false }
    }
    return true
  }

  const next = () => { if (validate()) setStep(s => s + 1) }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.budget_min) delete payload.budget_min
      if (!payload.budget_max) delete payload.budget_max
      if (!payload.deadline) delete payload.deadline
      if (!payload.max_revisions && payload.max_revisions !== 0) delete payload.max_revisions
      const { data: req } = await projectsApi.createRequest(payload)
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('category', 'project_request')
        fd.append('project_request', req.id)
        await filesApi.upload(fd).catch(() => { })
      }
      toast.success('درخواست شما با موفقیت ثبت شد!')
      navigate('/customer/projects')
    } catch (err) {
      const d = err.response?.data
      if (d) Object.entries(d).forEach(([k, v]) => toast.error(`${k}: ${Array.isArray(v) ? v[0] : v}`))
      else toast.error('ثبت ناموفق بود. لطفاً دوباره تلاش کنید.')
    } finally { setSaving(false) }
  }

  const addFiles = (newFiles) => {
    const validFiles = []
    Array.from(newFiles).forEach(file => {
      const error = validateFile(file)
      if (error) toast.error(error)
      else validFiles.push(file)
    })
    setFiles(x => [...x, ...validFiles])
  }
  const removeFile = (i) => setFiles(x => x.filter((_, j) => j !== i))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <PageHeader title="ثبت درخواست پروژه" subtitle="در مورد پروژهٔ رسانه‌ای خود توضیح دهید تا مناسب‌ترین فریلنسر برای شما پیدا شود" />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, marginBottom: 5, background: i + 1 <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: i + 1 <= step ? 'var(--accent)' : 'var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 ,lineHeight: "18px"}}>
                {i + 1 <= step - 1 ? '✓' : i + 1}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: i + 1 <= step ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <Field label="نوع پروژه" required>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginTop: 2 }}>
                {TYPES.map(([v, l]) => (
                  <button key={v} onClick={() => setForm(x => ({ ...x, project_type: v }))}
                    style={{ padding: '10px 8px', border: `1.5px solid ${form.project_type === v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: form.project_type === v ? 'var(--accent-glow)' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: form.project_type === v ? 'var(--accent)' : 'var(--text-sub)', fontWeight: form.project_type === v ? 600 : 400, textAlign: 'right', transition: 'all 0.15s', fontFamily: 'var(--font)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="عنوان پروژه" required>
              <input value={form.title} onChange={fv('title')} placeholder="مثلاً: ویدئوی معرفی برای کمپین عرضه محصول" />
            </Field>
            <Field label="توضیحات" required hint="چه چیزی نیاز دارید؟ هدف پروژه چیست؟ قرار است چه نتیجه‌ای حاصل شود؟">
              <textarea rows={5} value={form.description} onChange={fv('description')} placeholder="پروژه خود را با جزئیات توضیح دهید. هرچه اطلاعات بیشتری بدهید، تطبیق بهتری انجام می‌شود…" />
            </Field>
            <Field label="نیازمندی‌ها" required hint="مشخصات فنی، قالب تحویل، ابزارها یا سایر الزامات">
              <textarea rows={4} value={form.requirements} onChange={fv('requirements')} placeholder="مثلاً: رزولوشن ۱۹۲۰×۱۰۸۰، ویدئوی ۶۰ ثانیه‌ای، فرمت MP4، زیرنویس لازم…" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="سبک موردنظر" hint="ظاهر، حس، لحن و زیبایی موردنظر را توضیح دهید">
              <textarea rows={3} value={form.preferred_style} onChange={fv('preferred_style')} placeholder="مثلاً: سینمایی و دراماتیک، مینیمال با فاصله سفید، جسور و پرانرژی، رسمی و حرفه‌ای…" />
            </Field>
            <Field label="مخاطب هدف" hint="چه کسی این محتوا را می‌بیند یا استفاده می‌کند؟">
              <input value={form.target_audience} onChange={fv('target_audience')} placeholder="مثلاً: متخصصان شاغل ۲۸ تا ۴۵ ساله در صنعت فناوری" />
            </Field>
            <Field label="نمونه‌ها و مرجع‌ها" hint="لینک نمونه‌های موردپسند یا توضیح پروژه‌های مشابه">
              <textarea rows={3} value={form.sample_references} onChange={fv('sample_references')} placeholder="https://vimeo.com/example&#10;https://youtube.com/example&#10;یا توضیح: «مشابه ویدئوهای معرفی محصولات اپل»" />
            </Field>
            <Field label="محدودیت‌ها و شرایط ویژه" hint="راهنمای برند، محدودیت‌های قانونی، زبان‌ها، نبایدها و بایدها">
              <textarea rows={3} value={form.special_constraints} onChange={fv('special_constraints')} placeholder="مثلاً: باید از رنگ‌های برند #FF6B00 و #1A1A2E استفاده شود، نام رقیب نباید ذکر شود، زیرنویس عربی لازم است…" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="حداقل بودجه (دلار)" hint="حداقل بودجه شما">
                <input type="number" min="0" step="0.01" value={form.budget_min} onChange={fv('budget_min')} placeholder="مثلاً: 500" />
              </Field>
              <Field label="حداکثر بودجه (دلار)" hint="حداکثر بودجه شما">
                <input type="number" min="0" step="0.01" value={form.budget_max} onChange={fv('budget_max')} placeholder="مثلاً: 2000" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <DatePicker
                label="مهلت پروژه"
                value={form.deadline}
                onChange={fd('deadline')}
                placeholder="مهلت موردنظر را انتخاب کنید…"
                hint="از تقویم میلادی و هجری شمسی پشتیبانی می‌کند — دکمه تغییر تقویم در پایین انتخاب‌گر موجود است"
              />
              <Field label="حداکثر بازبینی‌ها" hint="چند دور بازبینی مجاز باشد؟">
                <input type="number" min="0" max="10" value={form.max_revisions} onChange={e => setForm(f => ({ ...f, max_revisions: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))} placeholder="مثلاً: 3" />
              </Field>
            </div>

            <Field label="پیوست‌ها" hint="آپلود مرجع‌ها، فایل‌های برند، جزئیات پروژه، mood board و ... (حداکثر ۵۰ مگابایت هر فایل)">
              <div
                style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                onClick={() => document.getElementById('reqFileInput').click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
                onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
              >
                <input id="reqFileInput" type="file" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📎</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>فایل‌ها را اینجا بکشید یا برای انتخاب کلیک کنید</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>تصاویر، ویدئوها، PDF، اسناد — حداکثر ۵۰ مگابایت هر کدام</p>
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {files.map((file, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', fontSize: '0.83rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: '1rem' }}>📄</span>
                        <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.75rem' }}>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      </div>
                      <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.8 }}>
              <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>خلاصه</strong>
              <span>نوع:</span> {TYPES.find(([v]) => v === form.project_type)?.[1] || '—'}<br />
              <span>عنوان:</span> {form.title || '—'}<br />
              {form.deadline && <><span>مهلت:</span> {form.deadline}<br /></>}
              {(form.budget_min || form.budget_max) && <><span>بودجه:</span> ${form.budget_min || 0} – ${form.budget_max || 'باز'}<br /></>}
              {(form.max_revisions || form.max_revisions === 0) && <><span>حداکثر بازبینی:</span> {form.max_revisions}<br /></>}
              {files.length > 0 && <><span>پیوست‌ها:</span> {files.length} فایل</>}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <Btn variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>&#8594; بازگشت</Btn>
          {step < 3
            ? <Btn onClick={next}>بعدی &larr;</Btn>
            : <Btn variant="success" onClick={handleSubmit} loading={saving}>ثبت درخواست &#10003;</Btn>
          }
        </div>
      </Card>
    </div>
  )
}
