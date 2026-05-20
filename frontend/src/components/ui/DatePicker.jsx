/**
 * DatePicker — supports both Gregorian and Solar Hijri (Jalali/Shamsi)
 * Pure JS implementation, no external library needed.
 * Returns value as YYYY-MM-DD (Gregorian ISO) regardless of display mode.
 */
import React, { useState, useRef, useEffect } from 'react'

// ── Jalali ↔ Gregorian conversion ─────────────────────────────────────────────
function toJalali(gy, gm, gd) {
  const g_d_no = [31,28,31,30,31,30,31,31,30,31,30,31]
  const j_d_no = [31,31,30,30,31,31,30,30,30,29,30,29]
  let jy=0,jm=0,jd=0
  gy -= 1600; gm -= 1; gd -= 1
  let g_day_no = 365*gy + Math.floor((gy+3)/4) - Math.floor((gy+99)/100) + Math.floor((gy+399)/400)
  for(let i=0;i<gm;i++) g_day_no += g_d_no[i]
  if(gm>1&&((gy%4===0&&gy%100!==0)||(gy%400===0))) g_day_no++
  g_day_no += gd
  let j_day_no = g_day_no - 79
  const j_np = Math.floor(j_day_no/12053); j_day_no %= 12053
  jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461)
  j_day_no %= 1461
  if(j_day_no >= 366){jy+=Math.floor((j_day_no-1)/365);j_day_no=(j_day_no-1)%365}
  for(let i=0;i<11&&j_day_no>=j_d_no[i];i++){j_day_no-=j_d_no[i];jm++}
  jd = j_day_no+1
  return [jy,jm+1,jd]
}

function toGregorian(jy,jm,jd) {
  const g_d_no=[31,28,31,30,31,30,31,31,30,31,30,31]
  const j_d_no=[31,31,30,30,31,31,30,30,30,29,30,29]
  jy -= 979; jm -= 1; jd -= 1
  let j_day_no = 365*jy + Math.floor(jy/33)*8 + Math.floor((jy%33+3)/4)
  for(let i=0;i<jm;i++) j_day_no += j_d_no[i]
  j_day_no += jd
  let g_day_no = j_day_no + 79
  let gy = 1600 + 400*Math.floor(g_day_no/146097); g_day_no %= 146097
  let leap=true
  if(g_day_no>=36525){g_day_no--;gy+=100*Math.floor(g_day_no/36524);g_day_no%=36524;if(g_day_no>=365)g_day_no++;else leap=false}
  gy += 4*Math.floor(g_day_no/1461); g_day_no %= 1461
  if(g_day_no>=366){leap=false;g_day_no--;gy+=Math.floor(g_day_no/365);g_day_no%=365}
  let gm=0
  for(let i=0;g_day_no>=g_d_no[i]+((i===1&&leap)?1:0);i++){g_day_no-=g_d_no[i]+((i===1&&leap)?1:0);gm++}
  return [gy, gm+1, g_day_no+1]
}

function jalaliMonthLen(jy, jm) {
  if(jm<=6) return 31
  if(jm<=11) return 30
  return (jy%33===1||jy%33===5||jy%33===9||jy%33===13||jy%33===17||jy%33===22||jy%33===26||jy%33===30)?30:29
}

function pad2(n){ return String(n).padStart(2,'0') }

const JALALI_MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
const JALALI_DAYS=['ش','ی','د','س','چ','پ','ج']
const GREG_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']
const GREG_DAYS=['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Main Component ─────────────────────────────────────────────────────────────
export function DatePicker({ value, onChange, label, hint, required, placeholder, minDate }) {
  const [open, setOpen]       = useState(false)
  const [solar, setSolar]     = useState(true)  // true = Jalali, false = Gregorian
  const [viewY, setViewY]     = useState(null)
  const [viewM, setViewM]     = useState(null)
  const ref = useRef(null)

  // Parse current value to set initial view
  useEffect(() => {
    if (value) {
      const [gy,gm,gd] = value.split('-').map(Number)
      if (solar) {
        const [jy,jm] = toJalali(gy,gm,gd)
        setViewY(jy); setViewM(jm)
      } else {
        setViewY(gy); setViewM(gm)
      }
    } else {
      const now = new Date()
      if (solar) {
        const [jy,jm] = toJalali(now.getFullYear(), now.getMonth()+1, now.getDate())
        setViewY(jy); setViewM(jm)
      } else {
        setViewY(now.getFullYear()); setViewM(now.getMonth()+1)
      }
    }
  }, [open, solar])

  // Click outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayValue = () => {
    if (!value) return ''
    const [gy,gm,gd] = value.split('-').map(Number)
    if (solar) {
      const [jy,jm,jd] = toJalali(gy,gm,gd)
      return `${jy}/${pad2(jm)}/${pad2(jd)}`
    }
    return value
  }

  const selectDay = (dayNum) => {
    let isoDate
    if (solar) {
      const [gy,gm,gd] = toGregorian(viewY, viewM, dayNum)
      isoDate = `${gy}-${pad2(gm)}-${pad2(gd)}`
    } else {
      isoDate = `${viewY}-${pad2(viewM)}-${pad2(dayNum)}`
    }
    onChange(isoDate)
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewM === 1) { setViewM(12); setViewY(y => y-1) }
    else setViewM(m => m-1)
  }
  const nextMonth = () => {
    if (viewM === 12) { setViewM(1); setViewY(y => y+1) }
    else setViewM(m => m+1)
  }

  const toggleCalendar = () => solar ? setSolar(false) : setSolar(true)

  // Build grid
  const buildGrid = () => {
    if (!viewY || !viewM) return []
    if (solar) {
      // For Jalali: find what day of week the 1st falls on
      const [gy1,gm1,gd1] = toGregorian(viewY, viewM, 1)
      const firstDow = new Date(gy1,gm1-1,gd1).getDay() // 0=Sun
      // Jalali week starts Saturday (6)
      const offset = (firstDow + 1) % 7  // shift so Saturday=0
      const totalDays = jalaliMonthLen(viewY, viewM)
      const cells = []
      for(let i=0;i<offset;i++) cells.push(null)
      for(let d=1;d<=totalDays;d++) cells.push(d)
      return cells
    } else {
      const firstDow = new Date(viewY, viewM-1, 1).getDay()
      const totalDays = new Date(viewY, viewM, 0).getDate()
      const cells = []
      for(let i=0;i<firstDow;i++) cells.push(null)
      for(let d=1;d<=totalDays;d++) cells.push(d)
      return cells
    }
  }

  const isSelected = (d) => {
    if (!value || !d) return false
    const [gy,gm,gd] = value.split('-').map(Number)
    if (solar) {
      const [jy,jm,jday] = toJalali(gy,gm,gd)
      return jy===viewY && jm===viewM && jday===d
    }
    return gy===viewY && gm===viewM && gd===d
  }

  const isToday = (d) => {
    if (!d) return false
    const now = new Date()
    if (solar) {
      const [jy,jm,jd] = toJalali(now.getFullYear(), now.getMonth()+1, now.getDate())
      return jy===viewY && jm===viewM && jd===d
    }
    return now.getFullYear()===viewY && now.getMonth()+1===viewM && now.getDate()===d
  }

  const cells  = buildGrid()
  const days   = solar ? JALALI_DAYS : GREG_DAYS
  const months = solar ? JALALI_MONTHS : GREG_MONTHS
  const monthLabel = solar ? `${JALALI_MONTHS[(viewM||1)-1]} ${viewY}` : `${GREG_MONTHS[(viewM||1)-1]} ${viewY}`

  return (
    <div style={{ marginBottom:'1rem' }}>
      {label && (
        <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--text-sub)', marginBottom:5 }}>
          {label}{required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
        </label>
      )}

      <div ref={ref} style={{ position:'relative' }}>
        {/* Input trigger */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0.75rem', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', cursor:'pointer', transition:'border-color 0.15s', minHeight:38, userSelect:'none' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
          onMouseLeave={e => { if(!open) e.currentTarget.style.borderColor='var(--border)' }}
        >
          <span style={{ fontSize:'0.875rem', color: value ? 'var(--text)' : 'var(--text-muted)' }}>
            {displayValue() || placeholder || 'Select date…'}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {value && (
              <button
                onClick={e => { e.stopPropagation(); onChange('') }}
                style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.85rem', lineHeight:1, padding:'0 2px' }}
              >×</button>
            )}
            <span style={{ fontSize:'0.85rem', opacity:0.5 }}>📅</span>
          </div>
        </div>

        {/* Dropdown calendar */}
        {open && viewY && viewM && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:500, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:'12px', minWidth:280, direction: solar ? 'rtl' : 'ltr' }}>

            {/* Header: prev / month+year / next */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <button onClick={solar ? nextMonth : prevMonth}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-sub)', fontSize:'1rem', padding:'4px 8px', borderRadius:'var(--radius-sm)', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >{solar ? '›' : '‹'}</button>
              <span style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--text)' }}>{monthLabel}</span>
              <button onClick={solar ? prevMonth : nextMonth}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-sub)', fontSize:'1rem', padding:'4px 8px', borderRadius:'var(--radius-sm)', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >{solar ? '‹' : '›'}</button>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
              {days.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600, color:'var(--text-muted)', padding:'4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {cells.map((d, i) => (
                <button key={i} onClick={() => d && selectDay(d)} disabled={!d}
                  style={{
                    padding:'6px 2px', border:'none', cursor: d ? 'pointer' : 'default',
                    background: isSelected(d) ? 'var(--accent)' : isToday(d) ? 'var(--accent-glow)' : 'transparent',
                    color: isSelected(d) ? 'white' : isToday(d) ? 'var(--accent)' : d ? 'var(--text)' : 'transparent',
                    borderRadius:'var(--radius-sm)', fontSize:'0.8rem', fontWeight: isSelected(d)||isToday(d) ? 600 : 400,
                    transition:'background 0.1s',
                    opacity: d ? 1 : 0,
                  }}
                  onMouseEnter={e => { if(d && !isSelected(d)) e.currentTarget.style.background='var(--bg-hover)' }}
                  onMouseLeave={e => { if(d && !isSelected(d)) e.currentTarget.style.background='transparent' }}
                >{d || ''}</button>
              ))}
            </div>

            {/* Footer: toggle calendar type */}
            <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'center', direction:'ltr' }}>
              <button onClick={toggleCalendar}
                style={{ fontSize:'0.74rem', color:'var(--accent)', background:'none', border:'1px solid rgba(47,129,247,0.3)', borderRadius:20, padding:'3px 12px', cursor:'pointer', fontFamily:'var(--font)', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--accent-glow)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >
                {solar ? 'Switch to Gregorian' : 'نمایش تقویم شمسی'}
              </button>
            </div>
          </div>
        )}
      </div>

      {hint && <p style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginTop:4 }}>{hint}</p>}
    </div>
  )
}

export default DatePicker
