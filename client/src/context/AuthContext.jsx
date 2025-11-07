import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar si hay usuario logueado al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await api.auth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        api.auth.logout()
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: !!user && user.rol === 'admin',
    isAuthenticated: !!user,
    
    login: async (credentials) => {
      try {
        setLoading(true)
        const response = await api.auth.login(credentials)
        setUser(response.user)
        return response
      } catch (error) {
        throw error
      } finally {
        setLoading(false)
      }
    },
    
    register: async (userData) => {
      try {
        setLoading(true)
        const response = await api.auth.register(userData)
        return response
      } catch (error) {
        throw error
      } finally {
        setLoading(false)
      }
    },
    
    logout: () => {
      api.auth.logout()
      setUser(null)
    }
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

