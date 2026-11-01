import React, { useState, useEffect } from 'react'
import { walletsApi } from '../../api'
import { Card, PageHeader, StatCard, Btn, Modal, Field, Table } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('transactions')
  const [payModal, setPayModal] = useState(false)
  const [form, setForm] = useState({ amount:'', method:'card' })

  const load = () => {
    Promise.all([
      walletsApi.myWallet().then(r => setWallet(r.data)),
      walletsApi.transactions().then(r => setTransactions(r.data.results || r.data)),
      walletsApi.invoices().then(r => setInvoices(r.data.results || r.data)),
    ]).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAddFunds = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    try {
      await walletsApi.createPayment({ amount: parseFloat(form.amount), method: form.method })
      toast.success('Payment initiated — pending admin processing')
      setPayModal(false)
      setForm({ amount:'', method:'card' })
      load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const txCols = [
    { label:'Type',   render: t => <span style={{ fontWeight:600, textTransform:'capitalize', color: ['credit','refund'].includes(t.type)?'var(--green)':'var(--red)' }}>{t.type_display}</span> },
    { label:'Amount', render: t => <span style={{ fontWeight:700, color: ['credit','refund'].includes(t.type)?'var(--green)':'var(--red)' }}>{['debit','payment','withdrawal'].includes(t.type)?'−':'+' }{fmt.currency(t.amount)}</span>, nowrap:true },
    { label:'Balance After', render: t => fmt.currency(t.balance_after), nowrap:true },
    { label:'Description', key:'description' },
    { label:'Date', render: t => fmt.datetime(t.created_at), nowrap:true },
  ]

  const invCols = [
    { label:'Invoice #', key:'invoice_number' },
    { label:'Amount',    render: i => <span style={{ fontWeight:700 }}>{fmt.currency(i.total_amount, i.currency)}</span>, nowrap:true },
    { label:'Status',    render: i => {
      const c = i.status==='paid'?'var(--green)':i.status==='overdue'?'var(--red)':'var(--amber)'
      return <span style={{ fontWeight:600, color:c, textTransform:'capitalize' }}>{i.status_display}</span>
    }},
    { label:'Due',  render: i => i.due_date ? fmt.date(i.due_date) : '—', nowrap:true },
    { label:'Date', render: i => fmt.datetime(i.created_at), nowrap:true },
  ]

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Your balance and transaction history"
        action={<Btn onClick={() => setPayModal(true)}>+ Add Funds</Btn>} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Current Balance" value={wallet ? fmt.currency(wallet.balance, wallet.currency) : '…'} icon="💰" accent="var(--green)" />
        <StatCard label="Transactions"    value={transactions.length} icon="📊" />
        <StatCard label="Invoices"        value={invoices.length}     icon="🧾" accent="var(--purple)" />
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.25rem' }}>
        {[['transactions','Transactions'],['invoices','Invoices']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:'0.875rem', fontWeight: tab===key?600:400, color: tab===key?'var(--accent)':'var(--text-muted)', borderBottom: tab===key?'2px solid var(--accent)':'2px solid transparent', marginBottom:'-1px', transition:'color 0.15s' }}>{label}</button>
        ))}
      </div>

      <Card style={{ padding:0 }}>
        {tab === 'transactions'
          ? <Table cols={txCols} rows={transactions} loading={loading} empty="No transactions yet" />
          : <Table cols={invCols} rows={invoices}    loading={loading} empty="No invoices yet" />
        }
      </Card>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Add Funds to Wallet">
        <Field label="Amount (USD)">
          <input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="100.00" />
        </Field>
        <Field label="Payment Method">
          <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
            <option value="card">Credit / Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paypal">PayPal</option>
          </select>
        </Field>
        <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'1rem', padding:'8px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', lineHeight:1.6 }}>
          ℹ️ This creates a pending payment that an admin will process. In production this connects to a payment gateway.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
          <Btn variant="secondary" onClick={() => setPayModal(false)}>Cancel</Btn>
          <Btn variant="success" onClick={handleAddFunds}>Initiate Payment</Btn>
        </div>
      </Modal>
    </div>
  )
}
