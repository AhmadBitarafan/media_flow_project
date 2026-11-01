import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'2rem' }}>
      <div style={{ fontSize:'5rem', fontWeight:800, color:'var(--border)', lineHeight:1, marginBottom:'1rem' }}>404</div>
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'0.5rem' }}>Page Not Found</h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'1.5rem', fontSize:'0.9rem' }}>The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" style={{ padding:'8px 20px', background:'var(--accent)', color:'white', borderRadius:'var(--radius)', fontWeight:600, fontSize:'0.9rem' }}>← Go Home</Link>
    </div>
  )
}
