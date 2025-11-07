import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function SoporteHome() {
  const { user, isAuthenticated } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && isAuthenticated) {
      loadTickets()
    }
  }, [user, isAuthenticated])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.soporte.listarTicketsUsuario(user.id_usuario)
      setTickets(data)
    } catch (error) {
      setError('Error al cargar tickets: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p>Debes iniciar sesión para acceder al soporte.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Soporte</h1>
        <p className="text-gray-600">Gestiona tus consultas y tickets de soporte</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Mis Tickets</h2>
        <Link to="nuevo" className="btn-primary">
          Crear Nuevo Ticket
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tickets...</p>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id_ticket} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      <Link to={`${ticket.id_ticket}`} className="hover:text-primary-600 transition-colors">
                        {ticket.asunto}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500">
                      Creado: {new Date(ticket.fecha_creacion).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.estado === 'Abierto' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.estado}
                    </span>
                    <Link to={`${ticket.id_ticket}`} className="btn-outline text-sm">
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes tickets</h3>
          <p className="text-gray-500 mb-4">¿Necesitas ayuda? Crea tu primer ticket de soporte</p>
          <Link to="nuevo" className="btn-primary">
            Crear Ticket
          </Link>
        </div>
      )}
    </div>
  )
}

function SoporteNuevo() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    asunto: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para crear un ticket')
      return
    }

    try {
      setLoading(true)
      setError('')
      await api.soporte.crearTicket(formData)
      navigate('/soporte')
    } catch (error) {
      setError('Error al crear ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p>Debes iniciar sesión para crear un ticket.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link to="/soporte" className="text-primary-600 hover:text-primary-800 mb-4 inline-block">
          ← Volver al soporte
        </Link>
        <h1 className="text-3xl font-bold mb-2">Crear Nuevo Ticket</h1>
        <p className="text-gray-600">Describe tu problema y te ayudaremos a resolverlo</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="card">
          <div className="card-content">
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  name="asunto"
                  placeholder="Resume brevemente tu problema"
                  value={formData.asunto}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Describe detalladamente tu problema, incluye pasos para reproducirlo si es posible"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="input"
                  rows="6"
                  required
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Creando...' : 'Crear Ticket'}
                </button>
                <Link to="/soporte" className="btn-outline">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function SoporteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [detalle, setDetalle] = useState(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadTicketDetail()
    }
  }, [id, isAuthenticated])

  const loadTicketDetail = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.soporte.detalleTicket(id)
      setDetalle(data)
    } catch (error) {
      setError('Error al cargar ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const onSend = async (e) => {
    e.preventDefault()
    if (!msg.trim()) return

    try {
      setLoading(true)
      await api.soporte.agregarMensaje(id, { emisor: 'user', contenido: msg })
      setMsg('')
      await loadTicketDetail()
    } catch (error) {
      setError('Error al enviar mensaje: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p>Debes iniciar sesión para ver los detalles del ticket.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link to="/soporte" className="text-primary-600 hover:text-primary-800 mb-4 inline-block">
          ← Volver al soporte
        </Link>
        <h1 className="text-3xl font-bold mb-2">Detalle del Ticket #{id}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && !detalle ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando ticket...</p>
        </div>
      ) : detalle ? (
        <div className="max-w-4xl">
          {/* Ticket Info */}
          <div className="card mb-6">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{detalle.ticket?.asunto}</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  detalle.ticket?.estado === 'Abierto' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {detalle.ticket?.estado}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{detalle.ticket?.descripcion}</p>
              <p className="text-sm text-gray-500">
                Creado: {new Date(detalle.ticket?.fecha_creacion).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Conversación</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {detalle.mensajes && detalle.mensajes.length > 0 ? (
                  detalle.mensajes.map(mensaje => (
                    <div key={mensaje.id_mensaje} className={`flex ${mensaje.emisor === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        mensaje.emisor === 'user' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{mensaje.contenido}</p>
                        <p className={`text-xs mt-1 ${
                          mensaje.emisor === 'user' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {new Date(mensaje.fecha_envio).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay mensajes aún</p>
                )}
              </div>
            </div>
          </div>

          {/* Reply Form */}
          {detalle.ticket?.estado === 'Abierto' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Responder</h3>
              </div>
              <div className="card-content">
                <form onSubmit={onSend} className="space-y-4">
                  <textarea
                    placeholder="Escribe tu mensaje..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    className="input"
                    rows="3"
                    disabled={loading}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !msg.trim()}
                      className="btn-primary"
                    >
                      {loading ? 'Enviando...' : 'Enviar Mensaje'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket no encontrado</h3>
          <p className="text-gray-500">El ticket que buscas no existe o no tienes permisos para verlo</p>
        </div>
      )}
    </div>
  )
}

export default function Soporte() {
  return (
    <Routes>
      <Route index element={<SoporteHome />} />
      <Route path="nuevo" element={<SoporteNuevo />} />
      <Route path=":id" element={<SoporteDetalle />} />
    </Routes>
  )
}

