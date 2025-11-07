import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export default function Perfil() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [rentals, setRentals] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData()
    }
  }, [isAuthenticated, user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const [rentalsData, paymentsData] = await Promise.all([
        api.rentals.list(),
        api.payments.getUserPayments(user.id_usuario)
      ])
      setRentals(rentalsData)
      setPayments(paymentsData)
    } catch (error) {
      setError('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p>Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información y actividad</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rentals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Alquileres
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial de Pagos
          </button>
        </nav>
      </div>

      {/* Información Personal Tab */}
      {activeTab === 'info' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Información Personal</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <p className="text-gray-900">{user?.nombre || 'No disponible'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <p className="text-gray-900">{user?.correo || 'No disponible'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de cuenta
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.rol === 'admin' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
                <div className="pt-4">
                  <button
                    onClick={logout}
                    className="btn-outline text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Estadísticas</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de alquileres:</span>
                  <span className="font-semibold">{rentals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de pagos:</span>
                  <span className="font-semibold">{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Miembro desde:</span>
                  <span className="font-semibold">2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mis Alquileres Tab */}
      {activeTab === 'rentals' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Mis Alquileres</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando alquileres...</p>
              </div>
            ) : rentals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Película
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Alquiler
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rentals.map((rental) => (
                      <tr key={rental.id_alquiler} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/peliculas/${rental.id_pelicula}`)}
                            className="text-primary-600 hover:text-primary-800 hover:underline text-left cursor-pointer transition-colors"
                          >
                            {rental.titulo || `Película #${rental.id_pelicula}`}
                          </button>
                          {rental.tipo && (
                            <span className="ml-2 text-xs text-gray-500">({rental.tipo})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rental.fecha_alquiler).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rental.estado === 'Activo' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rental.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes alquileres</h3>
                <p className="text-gray-500">Comienza a alquilar películas para verlas aquí</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de Pagos Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Historial de Pagos</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando pagos...</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id_pago}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${payment.monto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.metodo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.fecha_pago).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.estado === 'Completado' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pagos</h3>
                <p className="text-gray-500">Los pagos realizados aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

