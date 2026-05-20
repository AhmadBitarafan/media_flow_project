import React, { useState, useEffect } from 'react'
import { authApi, usersApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, PageHeader, Btn, Field } from '../../components/ui'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState('personal')
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState({ first_name:'', last_name:'', phone:'', email_notifications:true, sms_notifications:false })
  const [flProfile, setFlProfile] = useState({ bio:'', portfolio_url:'', years_experience:0, skills:'' })
  const [pw, setPw] = useState({ old_password:'', new_password:'', new_password2:'' })

  useEffect(() => {
    if (!user) return
    setInfo({ first_name: user.first_name||'', last_name: user.last_name||'', phone: user.phone||'', email_notifications: user.email_notifications!==false, sms_notifications: user.sms_notifications||false })
    if (user.freelancer_profile) {
      const p = user.freelancer_profile
      setFlProfile({ bio: p.bio||'', portfolio_url: p.portfolio_url||'', years_experience: p.years_experience||0, skills: Array.isArray(p.skills) ? p.skills.join(', ') : '' })
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await authApi.updateMe(info)
      if (user?.role === 'freelancer') {
        const skills = flProfile.skills.split(',').map(s=>s.trim()).filter(Boolean)
        await usersApi.updateFreelancerProfile({ ...flProfile, skills })
      }
      await refreshUser()
      toast.success('Profile updated!')
    } catch(e) {
      const d = e.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
      else toast.error('Update failed')
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async () => {
    if (pw.new_password !== pw.new_password2) { toast.error('Passwords do not match'); return }
    try {
      await authApi.changePassword(pw)
      toast.success('Password changed!')
      setPw({ old_password:'', new_password:'', new_password2:'' })
    } catch(e) {
      const d = e.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
    }
  }

  const tabs = [['personal','Personal Info'], ['security','Security'], ...(user?.role==='freelancer' ? [['freelancer','Freelancer Profile']] : [])]

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem' }}>
        {tabs.map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:'0.875rem', fontWeight: tab===key?600:400, color: tab===key?'var(--accent)':'var(--text-muted)', borderBottom: tab===key?'2px solid var(--accent)':'2px solid transparent', marginBottom:'-1px', transition:'color 0.15s' }}>{label}</button>
        ))}
      </div>

      {tab === 'personal' && (
        <Card>
          {/* Avatar header */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', paddingBottom:'1.25rem', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color:'white', flexShrink:0 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:'1rem' }}>{user?.first_name} {user?.last_name}</p>
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{user?.email} · <span style={{ textTransform:'capitalize' }}>{user?.role}</span></p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Field label="First Name"><input value={info.first_name} onChange={e=>setInfo(i=>({...i,first_name:e.target.value}))} /></Field>
            <Field label="Last Name"><input value={info.last_name} onChange={e=>setInfo(i=>({...i,last_name:e.target.value}))} /></Field>
          </div>
          <Field label="Phone"><input value={info.phone} onChange={e=>setInfo(i=>({...i,phone:e.target.value}))} placeholder="+1 555 000 0000" /></Field>

          <div style={{ marginBottom:'1.25rem' }}>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-sub)', marginBottom:8 }}>Notifications</p>
            {[['email_notifications','Email Notifications'],['sms_notifications','SMS Notifications']].map(([k,l]) => (
              <label key={k} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:6, cursor:'pointer', fontSize:'0.875rem', color:'var(--text-sub)' }}>
                <input type="checkbox" checked={info[k]} onChange={e=>setInfo(i=>({...i,[k]:e.target.checked}))} />
                {l}
              </label>
            ))}
          </div>
          <Btn onClick={handleSave} loading={saving}>Save Changes</Btn>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <h3 style={{ fontWeight:600, marginBottom:'1.25rem', fontSize:'0.95rem' }}>Change Password</h3>
          <Field label="Current Password"><input type="password" value={pw.old_password} onChange={e=>setPw(p=>({...p,old_password:e.target.value}))} /></Field>
          <Field label="New Password"><input type="password" value={pw.new_password} onChange={e=>setPw(p=>({...p,new_password:e.target.value}))} /></Field>
          <Field label="Confirm New Password"><input type="password" value={pw.new_password2} onChange={e=>setPw(p=>({...p,new_password2:e.target.value}))} /></Field>
          <Btn onClick={handlePasswordChange}>Update Password</Btn>
        </Card>
      )}

      {tab === 'freelancer' && (
        <Card>
          <div style={{ padding:'10px 14px', background:'var(--accent-glow)', border:'1px solid rgba(47,129,247,0.2)', borderRadius:'var(--radius)', marginBottom:'1.25rem', fontSize:'0.83rem', color:'var(--text-sub)', lineHeight:1.7 }}>
            <strong>Status:</strong> <span style={{ textTransform:'capitalize', color:'var(--accent)' }}>{user?.freelancer_profile?.verification_status}</span> &nbsp;·&nbsp;
            <strong>Level:</strong> <span style={{ color:'var(--amber)' }}>{user?.freelancer_profile?.level?.name || 'Not assigned'}</span>
          </div>
          <Field label="Bio" hint="Tell clients about yourself">
            <textarea rows={4} value={flProfile.bio} onChange={e=>setFlProfile(p=>({...p,bio:e.target.value}))} placeholder="Describe your expertise and experience…" />
          </Field>
          <Field label="Portfolio URL">
            <input value={flProfile.portfolio_url} onChange={e=>setFlProfile(p=>({...p,portfolio_url:e.target.value}))} placeholder="https://yourportfolio.com" />
          </Field>
          <Field label="Years of Experience">
            <input type="number" min={0} value={flProfile.years_experience} onChange={e=>setFlProfile(p=>({...p,years_experience:e.target.value}))} />
          </Field>
          <Field label="Skills" hint="Comma-separated: Video Editing, Motion Graphics, Color Grading">
            <input value={flProfile.skills} onChange={e=>setFlProfile(p=>({...p,skills:e.target.value}))} placeholder="Skill 1, Skill 2, Skill 3" />
          </Field>
          <Btn onClick={handleSave} loading={saving}>Save Profile</Btn>
        </Card>
      )}
    </div>
  )
}
