import React, { useState, useEffect } from 'react'
import { walletsApi, usersApi } from '../../api'
import { Card, PageHeader, Badge, Btn, Modal, Field, Table, StatCard } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

export default function AdminWallets() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('payments')
  const [adjustModal, setAdjustModal] = useState(false)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id:'', amount:'', type:'credit', description:'' })

  useEffect(() => {
    Promise.all([
      walletsApi.payments().then(r => setPayments(r.data.results || r.data)),
      walletsApi.invoices().then(r => setInvoices(r.data.results || r.data)),
    ]).finally(() => setLoading(false))
    Promise.all([
      usersApi.adminUsers({ role:'freelancer' }).then(r => r.data.results || r.data),
      usersApi.adminUsers({ role:'customer' }).then(r => r.data.results || r.data),
    ]).then(([fl, cu]) => setUsers([...fl, ...cu])).catch(()=>{})
  }, [])

  const handleAdjust = async () => {
    if (!form.user_id || !form.amount || !form.description) { toast.error('تمامی فیلدها لازم هستند'); return }
    try {
      await walletsApi.adjust({ user_id: form.user_id, amount: parseFloat(form.amount), type: form.type, description: form.description })
      toast.success('کیف پول به‌روزرسانی شد')
      setAdjustModal(false)
      setForm({ user_id:'', amount:'', type:'credit', description:'' })
    } catch(e) { toast.error(e.response?.data?.error || 'ناموفق') }
  }

  const handleProcess = async (paymentId) => {
    try {
      await walletsApi.processPayment(paymentId)
      toast.success('پرداخت انجام شد')
      walletsApi.payments().then(r => setPayments(r.data.results || r.data))
    } catch { toast.error('ناموفق') }
  }

  const completed = payments.filter(p => p.status === 'completed').length
  const pending   = payments.filter(p => p.status === 'pending').length

  const paymentCols = [
    { label:'مشتری',  render: p => <span style={{ fontWeight:500 }}>{p.customer?.full_name || '—'}</span> },
    { label:'مبلغ',    render: p => <span style={{ fontWeight:700 }}>{fmt.currency(p.amount, p.currency)}</span>, nowrap:true },
    { label:'روش',    render: p => p.method_display },
    { label:'وضعیت',    render: p => <Badge status={p.status} label={p.status_display} /> },
    { label:'تاریخ',      render: p => fmt.datetime(p.created_at), nowrap:true },
    { label:'', render: p => p.status==='pending'
        ? <Btn size="xs" variant="success" onClick={() => handleProcess(p.id)}>پردازش</Btn>
        : null },
  ]

  const invoiceCols = [
    { label:'فاکتور #', key:'invoice_number' },
    { label:'مشتری',  render: i => i.customer?.full_name || '—' },
    { label:'مبلغ',    render: i => <span style={{ fontWeight:700 }}>{fmt.currency(i.total_amount, i.currency)}</span>, nowrap:true },
    { label:'وضعیت',    render: i => <Badge status={i.status} label={i.status_display} /> },
    { label:'سررسید',       render: i => i.due_date ? fmt.date(i.due_date) : '—', nowrap:true },
    { label:'تاریخ',      render: i => fmt.datetime(i.created_at), nowrap:true },
  ]

  return (
    <div>
      <PageHeader title="کیف پول و پرداخت‌ها" subtitle="مدیریت تراکنش‌ها و تنظیم موجودی"
        action={<Btn onClick={() => setAdjustModal(true)}>💰 تنظیم کیف پول</Btn>} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="کل پرداخت‌ها"  value={payments.length}  icon="💳" />
        <StatCard label="تکمیل‌شده"       value={completed}        icon="✅" accent="var(--green)" />
        <StatCard label="در انتظار"         value={pending}          icon="⏳" accent="var(--amber)" />
        <StatCard label="فاکتورها"        value={invoices.length}  icon="🧾" accent="var(--purple)" />
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.25rem' }}>
        {[['payments','پرداخت‌ها'],['invoices','فاکتورها']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:'0.875rem', fontWeight: tab===key?600:400, color: tab===key?'var(--accent)':'var(--text-muted)', borderBottom: tab===key?'2px solid var(--accent)':'2px solid transparent', marginBottom:'-1px', transition:'color 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      <Card style={{ padding:0 }}>
        {tab === 'payments'
          ? <Table cols={paymentCols} rows={payments} loading={loading} empty="هنوز پرداختی وجود ندارد" />
          : <Table cols={invoiceCols} rows={invoices} loading={loading} empty="هنوز فاکتوری وجود ندارد" />
        }
      </Card>

      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="تنظیم موجودی کیف پول">
        <Field label="کاربر">
          <select value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))}>
            <option value="">کاربر را انتخاب کنید…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
          </select>
        </Field>
        <Field label="عملیات">
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="credit">اعتبار — اضافه کردن موجودی</option>
            <option value="debit">بدهی — کم کردن موجودی</option>
          </select>
        </Field>
        <Field label="مبلغ (دلار)">
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" />
        </Field>
        <Field label="دلیل / توضیح">
          <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="مثلاً: پرداخت پروژه، پاداش، استرداد…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setAdjustModal(false)}>انصراف</Btn>
          <Btn variant={form.type==='credit'?'success':'danger'} onClick={handleAdjust}>
            {form.type==='credit' ? '+ اعتبار' : '− بدهی'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
