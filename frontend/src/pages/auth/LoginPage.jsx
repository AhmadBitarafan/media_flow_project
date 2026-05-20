import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const u = await login(form.email, form.password)
      const dest = { admin:'/admin', supervisor:'/admin', customer:'/customer', freelancer:'/freelancer' }
      navigate(dest[u.role] || '/customer')
      toast.success(`Welcome back, ${u.first_name}!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--accent)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
            <span style={{ color:'white', fontWeight:800, fontSize:'1rem' }}>MF</span>
          </div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Welcome back</h1>
          <p style={{ color:'var(--text-muted)', marginTop:4, fontSize:'0.875rem' }}>Sign in to MediaFlow</p>
        </div>
        <form onSubmit={submit} style={{ background:'var(--bg-card)', borderRadius:'var(--radius-xl)', padding:'1.75rem', border:'1px solid var(--border)' }}>
          <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--text-sub)', marginBottom:4 }}>Email</label>
          <input type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" style={{ marginBottom:'1rem' }} />
          <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--text-sub)', marginBottom:4 }}>Password</label>
          <input type="password" required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" style={{ marginBottom:'1.25rem' }} />
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'9px', background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--radius)', fontWeight:600, fontSize:'0.9rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'var(--font)', transition:'opacity 0.15s' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
            No account?{' '}<Link to="/register" style={{ color:'var(--accent)', fontWeight:500 }}>Create one</Link>
          </p>
        </form>
        <div style={{ marginTop:'1rem', padding:'1rem', background:'rgba(47,129,247,0.06)', borderRadius:'var(--radius-lg)', border:'1px solid rgba(47,129,247,0.15)', fontSize:'0.76rem', color:'var(--text-muted)', lineHeight:2 }}>
          <strong style={{ color:'var(--accent)', display:'block', marginBottom:4 }}>Demo accounts</strong>
          admin@mediaflow.io / admin123!<br/>
          supervisor@mediaflow.io / super123!<br/>
          customer@example.com / customer123!<br/>
          freelancer@example.com / freelancer123!
        </div>
      </div>
    </div>
  )
}
