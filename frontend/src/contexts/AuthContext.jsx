import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
      return data
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('access')) loadMe().finally(() => setLoading(false))
    else setLoading(false)
  }, [loadMe])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('access',  data.access)
    localStorage.setItem('refresh', data.refresh)
    setUser(data.user)
    return data.user
  }

  const register = async (form) => {
    const { data } = await authApi.register(form)
    localStorage.setItem('access',  data.access)
    localStorage.setItem('refresh', data.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const r = localStorage.getItem('refresh')
    try { if (r) await authApi.logout(r) } catch { /* ignore */ }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser: loadMe }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
