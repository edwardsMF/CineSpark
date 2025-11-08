const API_BASE_URL = 'http://localhost:4000/api'

// Helper para hacer requests con autenticación
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  }

  // Si hay body, asegurarse de que esté en formato JSON string
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  } else if (options.body) {
    config.body = options.body
  }

  try {
    console.log('🌐 API Request:', { url, method: config.method })
    const response = await fetch(url, config)
    
    console.log('📥 API Response:', { status: response.status, ok: response.ok })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Error HTTP ${response.status}` }))
      console.error('❌ API Error:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ API Success:', data)
    return data
  } catch (error) {
    console.error('❌ API Request Error:', error)
    if (error.message) {
      throw error
    }
    throw new Error(error.message || 'Error de conexión con el servidor')
  }
}

export const api = {
  auth: {
    login: async ({ correo, contrasena }) => {
      console.log('🔐 Intentando login:', { correo })
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { correo, contrasena }
      })
      
      console.log('✅ Login response:', response)
      
      if (!response.token) {
        throw new Error('No se recibió token del servidor')
      }
      
      // Guardar token
      localStorage.setItem('token', response.token)
      
      // Usar la información del usuario devuelta por el backend
      const user = response.user || {
        id_usuario: JSON.parse(atob(response.token.split('.')[1])).sub,
        rol: JSON.parse(atob(response.token.split('.')[1])).role,
        correo: correo
      }
      
      console.log('👤 Usuario logueado:', user)
      return { token: response.token, user }
    },
    
    register: async ({ nombre, correo, contrasena }) => {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: { nombre, correo, contrasena }
      })
      return response
    },
    
    logout: () => {
      localStorage.removeItem('token')
    },
    
    getCurrentUser: async () => {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      try {
        // Obtener información completa del usuario desde el backend
        const user = await apiRequest('/auth/me')
        return user
      } catch {
        // Fallback: usar solo la información del token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          return { id_usuario: payload.sub, rol: payload.role }
        } catch {
          return null
        }
      }
    }
  },
  
  movies: {
    list: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      return apiRequest(`/movies?${params}`)
    },
    
    getById: async (id) => {
      return apiRequest(`/movies/${id}`)
    },
    
    create: async (movieData) => {
      return apiRequest('/movies', {
        method: 'POST',
        body: JSON.stringify(movieData)
      })
    },
    
    update: async (id, movieData) => {
      return apiRequest(`/movies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(movieData)
      })
    },
    
    delete: async (id) => {
      return apiRequest(`/movies/${id}`, {
        method: 'DELETE'
      })
    }
  },
  
  rentals: {
    list: async () => {
      return apiRequest('/rentals')
    },
    
    create: async (rentalData) => {
      return apiRequest('/rentals', {
        method: 'POST',
        body: JSON.stringify(rentalData)
      })
    },
    
    check: async (movieId) => {
      return apiRequest(`/rentals/check/${movieId}`)
    },
    
    cancel: async (rentalId) => {
      return apiRequest(`/rentals/${rentalId}/cancel`, {
        method: 'POST'
      })
    },
    
    extend: async (rentalId, diasAdicionales, metodoPago = 'tarjeta') => {
      return apiRequest(`/rentals/${rentalId}/extend`, {
        method: 'POST',
        body: JSON.stringify({ 
          dias_adicionales: diasAdicionales,
          metodo_pago: metodoPago
        })
      })
    }
  },
  
  payments: {
    payRental: async (paymentData) => {
      return apiRequest('/pagos/alquiler', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })
    },
    
    paySubscription: async (paymentData) => {
      return apiRequest('/pagos/suscripcion', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })
    },
    
    getUserPayments: async (userId) => {
      return apiRequest(`/pagos/${userId}`)
    }
  },
  
  subscriptions: {
    list: async () => {
      return apiRequest('/subscriptions')
    },
    
    create: async (subscriptionData) => {
      return apiRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      })
    }
  },
  
  invoices: {
    getUserInvoices: async (userId) => {
      return apiRequest(`/facturas/${userId}`)
    }
  },
  
  soporte: {
    crearTicket: async ({ asunto, descripcion }) => {
      const userId = api.auth.getCurrentUser()?.id_usuario
      return apiRequest('/tickets/crear', {
        method: 'POST',
        body: JSON.stringify({ id_usuario: userId, asunto, descripcion })
      })
    },
    
    listarTicketsUsuario: async (userId) => {
      return apiRequest(`/tickets/usuario/${userId}`)
    },
    
    detalleTicket: async (id) => {
      return apiRequest(`/tickets/${id}`)
    },
    
    agregarMensaje: async (id, { emisor, contenido }) => {
      return apiRequest(`/tickets/${id}/mensaje`, {
        method: 'POST',
        body: JSON.stringify({ emisor, contenido })
      })
    },
    
    getAllTickets: async () => {
      return apiRequest('/tickets/admin/all')
    }
  }
}

