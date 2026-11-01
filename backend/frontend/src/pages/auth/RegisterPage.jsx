import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', password:'', password2:'', role:'customer' })
  const [loading, setLoading] = useState(false)
  const s = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))
  const lbl = { display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--text-sub)', marginBottom:4 }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const u = await register(form)
      navigate(u.role === 'freelancer' ? '/freelancer' : '/customer')
      toast.success('Account created!')
    } catch (err) {
      const d = err.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
      else toast.error('Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--accent)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
            <span style={{ color:'white', fontWeight:800, fontSize:'1rem' }}>MF</span>
          </div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Create account</h1>
          <p style={{ color:'var(--text-muted)', marginTop:4, fontSize:'0.875rem' }}>Join MediaFlow today</p>
        </div>
        <form onSubmit={submit} style={{ background:'var(--bg-card)', borderRadius:'var(--radius-xl)', padding:'1.75rem', border:'1px solid var(--border)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.875rem' }}>
            <div><label style={lbl}>First Name</label><input required value={form.first_name} onChange={s('first_name')} /></div>
            <div><label style={lbl}>Last Name</label><input required value={form.last_name} onChange={s('last_name')} /></div>
          </div>
          <div style={{ marginBottom:'0.875rem' }}><label style={lbl}>Email</label><input type="email" required value={form.email} onChange={s('email')} /></div>
          <div style={{ marginBottom:'0.875rem' }}>
            <label style={lbl}>I am a…</label>
            <select value={form.role} onChange={s('role')}>
              <option value="customer">Customer — I need media work done</option>
              <option value="freelancer">Freelancer — I create media</option>
            </select>
          </div>
          <div style={{ marginBottom:'0.875rem' }}><label style={lbl}>Password</label><input type="password" required value={form.password} onChange={s('password')} /></div>
          <div style={{ marginBottom:'1.25rem' }}><label style={lbl}>Confirm Password</label><input type="password" required value={form.password2} onChange={s('password2')} /></div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'9px', background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--radius)', fontWeight:600, fontSize:'0.9rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'var(--font)' }}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
          <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
            Have an account?{' '}<Link to="/login" style={{ color:'var(--accent)', fontWeight:500 }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
