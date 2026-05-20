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
    // Load users for adjustment dropdown
    Promise.all([
      usersApi.adminUsers({ role:'freelancer' }).then(r => r.data.results || r.data),
      usersApi.adminUsers({ role:'customer' }).then(r => r.data.results || r.data),
    ]).then(([fl, cu]) => setUsers([...fl, ...cu])).catch(()=>{})
  }, [])

  const handleAdjust = async () => {
    if (!form.user_id || !form.amount || !form.description) { toast.error('All fields required'); return }
    try {
      await walletsApi.adjust({ user_id: form.user_id, amount: parseFloat(form.amount), type: form.type, description: form.description })
      toast.success('Wallet adjusted')
      setAdjustModal(false)
      setForm({ user_id:'', amount:'', type:'credit', description:'' })
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleProcess = async (paymentId) => {
    try {
      await walletsApi.processPayment(paymentId)
      toast.success('Payment processed')
      walletsApi.payments().then(r => setPayments(r.data.results || r.data))
    } catch { toast.error('Failed') }
  }

  const completed = payments.filter(p => p.status === 'completed').length
  const pending   = payments.filter(p => p.status === 'pending').length

  const paymentCols = [
    { label:'Customer',  render: p => <span style={{ fontWeight:500 }}>{p.customer?.full_name || '—'}</span> },
    { label:'Amount',    render: p => <span style={{ fontWeight:700 }}>{fmt.currency(p.amount, p.currency)}</span>, nowrap:true },
    { label:'Method',    render: p => p.method_display },
    { label:'Status',    render: p => <Badge status={p.status} label={p.status_display} /> },
    { label:'Date',      render: p => fmt.datetime(p.created_at), nowrap:true },
    { label:'', render: p => p.status==='pending'
        ? <Btn size="xs" variant="success" onClick={() => handleProcess(p.id)}>Process</Btn>
        : null },
  ]

  const invoiceCols = [
    { label:'Invoice #', key:'invoice_number' },
    { label:'Customer',  render: i => i.customer?.full_name || '—' },
    { label:'Amount',    render: i => <span style={{ fontWeight:700 }}>{fmt.currency(i.total_amount, i.currency)}</span>, nowrap:true },
    { label:'Status',    render: i => <Badge status={i.status} label={i.status_display} /> },
    { label:'Due',       render: i => i.due_date ? fmt.date(i.due_date) : '—', nowrap:true },
    { label:'Date',      render: i => fmt.datetime(i.created_at), nowrap:true },
  ]

  return (
    <div>
      <PageHeader title="Wallets & Payments" subtitle="Manage transactions and adjust balances"
        action={<Btn onClick={() => setAdjustModal(true)}>💰 Adjust Wallet</Btn>} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Total Payments"  value={payments.length}  icon="💳" />
        <StatCard label="Completed"       value={completed}        icon="✅" accent="var(--green)" />
        <StatCard label="Pending"         value={pending}          icon="⏳" accent="var(--amber)" />
        <StatCard label="Invoices"        value={invoices.length}  icon="🧾" accent="var(--purple)" />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.25rem' }}>
        {[['payments','Payments'],['invoices','Invoices']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:'0.875rem', fontWeight: tab===key?600:400, color: tab===key?'var(--accent)':'var(--text-muted)', borderBottom: tab===key?'2px solid var(--accent)':'2px solid transparent', marginBottom:'-1px', transition:'color 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      <Card style={{ padding:0 }}>
        {tab === 'payments'
          ? <Table cols={paymentCols} rows={payments} loading={loading} empty="No payments yet" />
          : <Table cols={invoiceCols} rows={invoices} loading={loading} empty="No invoices yet" />
        }
      </Card>

      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="Adjust Wallet Balance">
        <Field label="User">
          <select value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))}>
            <option value="">Select user…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
          </select>
        </Field>
        <Field label="Operation">
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="credit">Credit — Add funds</option>
            <option value="debit">Debit — Remove funds</option>
          </select>
        </Field>
        <Field label="Amount (USD)">
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" />
        </Field>
        <Field label="Reason / Description">
          <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Project payment, bonus, refund…" />
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setAdjustModal(false)}>Cancel</Btn>
          <Btn variant={form.type==='credit'?'success':'danger'} onClick={handleAdjust}>
            {form.type==='credit' ? '+ Credit' : '− Debit'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
