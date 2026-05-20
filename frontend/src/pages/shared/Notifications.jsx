import React, { useState, useEffect } from 'react'
import { notifApi } from '../../api'
import { PageHeader, Card, Btn, Empty } from '../../components/ui'
import { fmt } from '../../utils'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  project_assigned:'🎯', project_status_updated:'🔄', project_request_reviewed:'🔍',
  revision_requested:'↩', delivery_approved:'✅', ticket_replied:'💬',
  new_ticket:'🎫', payment_status:'💳', wallet_adjusted:'💰',
  file_uploaded:'📎', new_project_request:'📋', general:'🔔',
  ticket_replied_by_customer:'💬',
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = (unread=false) => {
    notifApi.list(unread ? { unread: true } : {})
      .then(r => setNotifs(r.data.results || r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(unreadOnly) }, [unreadOnly])

  const markRead = async (id) => {
    await notifApi.markRead(id)
    setNotifs(n => n.map(x => x.id===id ? {...x, is_read:true} : x))
  }

  const markAll = async () => {
    await notifApi.markAll()
    setNotifs(n => n.map(x => ({...x, is_read:true})))
    toast.success('All marked as read')
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <Btn size="sm" variant={unreadOnly?'primary':'secondary'} onClick={() => setUnreadOnly(s=>!s)}>
              {unreadOnly ? 'Show All' : 'Unread Only'}
            </Btn>
            {unreadCount > 0 && <Btn size="sm" variant="ghost" onClick={markAll}>Mark all read</Btn>}
          </div>
        }
      />

      {loading ? <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'3rem' }}>Loading…</p> :
        notifs.length === 0 ? (
          <Empty icon="🔔" title="No notifications"
            message={unreadOnly ? 'No unread notifications.' : "You're all caught up!"} />
        ) : (
          <Card style={{ padding:0 }}>
            {notifs.map((n, i) => (
              <div key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{ display:'flex', gap:'0.85rem', padding:'14px 18px', cursor: n.is_read?'default':'pointer', background: n.is_read?'transparent':'rgba(47,129,247,0.04)', borderBottom: i < notifs.length-1 ? '1px solid var(--border-muted)' : 'none', transition:'background 0.15s' }}
                onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background='rgba(47,129,247,0.08)' }}
                onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background='rgba(47,129,247,0.04)' }}
              >
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.95rem', flexShrink:0 }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                    <p style={{ fontWeight: n.is_read?400:600, color:'var(--text)', fontSize:'0.875rem' }}>{n.title}</p>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', flexShrink:0 }}>{fmt.relative(n.created_at)}</span>
                  </div>
                  <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2, lineHeight:1.5 }}>{n.message}</p>
                </div>
                {!n.is_read && (
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:4 }} />
                )}
              </div>
            ))}
          </Card>
        )
      }
    </div>
  )
}
