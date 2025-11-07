import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export default function PeliculaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRentalForm, setShowRentalForm] = useState(false)
  const [showExtendForm, setShowExtendForm] = useState(false)
  const [rentalSuccess, setRentalSuccess] = useState(false)
  const [currentRental, setCurrentRental] = useState(null)
  const [checkingRental, setCheckingRental] = useState(false)
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    metodo_pago: 'tarjeta',
    notas: ''
  })
  const [extendFormData, setExtendFormData] = useState({
    dias_adicionales: '7',
    metodo_pago: 'tarjeta'
  })
  const [submitting, setSubmitting] = useState(false)

  // Calcular precio total basado en las fechas
  const calcularPrecioTotal = () => {
    if (!movie?.precio_dia || !formData.fecha_inicio || !formData.fecha_fin) {
      return 0
    }

    // Convertir precio_dia a número (puede venir como string desde PostgreSQL)
    const precioDia = parseFloat(movie.precio_dia) || 0
    if (precioDia <= 0) {
      return 0
    }

    const inicio = new Date(formData.fecha_inicio)
    const fin = new Date(formData.fecha_fin)
    
    // Validar que las fechas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return 0
    }
    
    const diffTime = Math.abs(fin - inicio)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos días
    
    return precioDia * diffDays
  }

  // Formatear precio en pesos colombianos
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  const precioTotal = calcularPrecioTotal()
  const diasAlquiler = formData.fecha_inicio && formData.fecha_fin 
    ? Math.ceil(Math.abs(new Date(formData.fecha_fin) - new Date(formData.fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1
    : 0

  useEffect(() => {
    loadMovie()
    // Si la URL contiene /alquilar, mostrar el formulario directamente
    if (window.location.pathname.includes('/alquilar')) {
      setShowRentalForm(true)
    }
  }, [id])

  useEffect(() => {
    if (isAuthenticated && user && id) {
      checkRentalStatus()
    }
  }, [isAuthenticated, user, id])

  const loadMovie = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.movies.getById(id)
      setMovie(data)
    } catch (error) {
      setError('Error al cargar la película: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const checkRentalStatus = async () => {
    if (!isAuthenticated || !user) return
    
    try {
      setCheckingRental(true)
      const result = await api.rentals.check(id)
      if (result.tiene_alquiler) {
        setCurrentRental(result.alquiler)
      } else {
        setCurrentRental(null)
      }
    } catch (error) {
      console.error('Error al verificar estado de alquiler:', error)
    } finally {
      setCheckingRental(false)
    }
  }

  const handleCancelRental = async () => {
    if (!currentRental) return
    
    if (!confirm('¿Estás seguro de que deseas cancelar este alquiler?')) {
      return
    }
    
    try {
      setSubmitting(true)
      await api.rentals.cancel(currentRental.id_alquiler)
      setCurrentRental(null)
      alert('Alquiler cancelado exitosamente')
      await checkRentalStatus()
    } catch (error) {
      alert('Error al cancelar el alquiler: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExtendRental = async (e) => {
    if (e) e.preventDefault()
    
    if (!currentRental || !movie) {
      alert('No hay información de alquiler disponible')
      return
    }
    
    const dias = parseInt(extendFormData.dias_adicionales)
    if (!dias || isNaN(dias) || dias <= 0) {
      alert('Por favor ingresa un número válido de días adicionales')
      return
    }
    
    const precioDia = parseFloat(movie.precio_dia) || 0
    if (precioDia <= 0) {
      alert('Esta película/serie no tiene un precio configurado')
      return
    }
    
    const montoTotal = precioDia * dias
    
    try {
      setSubmitting(true)
      console.log('📝 Extendiendo alquiler:', {
        id_alquiler: currentRental.id_alquiler,
        dias: dias,
        metodo_pago: extendFormData.metodo_pago
      })
      
      const result = await api.rentals.extend(currentRental.id_alquiler, dias, extendFormData.metodo_pago)
      
      console.log('✅ Resultado de extensión:', result)
      
      // Mostrar mensaje de éxito
      setRentalSuccess(true)
      setShowExtendForm(false)
      
      // Limpiar formulario
      setExtendFormData({
        dias_adicionales: '7',
        metodo_pago: 'tarjeta'
      })
      
      await checkRentalStatus()
    } catch (error) {
      console.error('❌ Error al extender alquiler:', error)
      const errorMessage = error.message || 'Error desconocido al extender el alquiler'
      alert('Error al extender el alquiler: ' + errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExtendInputChange = (e) => {
    const { name, value } = e.target
    setExtendFormData(prev => ({ ...prev, [name]: value }))
  }

  const calcularMontoExtension = () => {
    if (!movie?.precio_dia || !extendFormData.dias_adicionales) {
      return 0
    }
    const precioDia = parseFloat(movie.precio_dia) || 0
    const dias = parseInt(extendFormData.dias_adicionales) || 0
    return precioDia * dias
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitRental = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      alert('Debes iniciar sesión para alquilar')
      navigate('/login')
      return
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert('Por favor completa las fechas de alquiler')
      return
    }

    // Validar que el precio sea válido
    const precioDia = parseFloat(movie?.precio_dia) || 0
    if (precioDia <= 0) {
      alert('Esta película no tiene un precio configurado. Por favor contacta al administrador.')
      return
    }
    
    if (precioTotal <= 0) {
      alert('Por favor selecciona fechas válidas para calcular el precio del alquiler')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Primero crear el alquiler en la base de datos
      const rentalData = {
        id_usuario: user.id_usuario,
        id_pelicula: parseInt(id),
        estado: 'Activo'
      }

      console.log('📝 Creando alquiler:', rentalData)
      
      const rentalResult = await api.rentals.create(rentalData)
      
      console.log('✅ Alquiler creado exitosamente:', rentalResult)
      
      // Luego procesar el pago
      const paymentData = {
        id_usuario: user.id_usuario,
        id_pelicula: parseInt(id),
        monto: precioTotal,
        metodo: formData.metodo_pago
      }

      console.log('💳 Procesando pago:', paymentData)
      
      const paymentResult = await api.payments.payRental(paymentData)
      
      console.log('✅ Pago procesado exitosamente:', paymentResult)
      
      // Mostrar mensaje de éxito
      setRentalSuccess(true)
      setShowRentalForm(false)
      
      // Limpiar formulario
      setFormData({
        fecha_inicio: '',
        fecha_fin: '',
        metodo_pago: 'tarjeta',
        notas: ''
      })
      
      // Actualizar el estado del alquiler
      await checkRentalStatus()
    } catch (error) {
      console.error('❌ Error al procesar el alquiler:', error)
      setError('Error al procesar el alquiler: ' + error.message)
      
      // Si el error es que ya existe un alquiler, actualizar el estado
      if (error.message.includes('Ya tienes un alquiler activo')) {
        await checkRentalStatus()
      }
      
      alert('Error al procesar el alquiler: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de la película...</p>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Película no encontrada</h3>
          <p className="text-gray-500 mb-4">{error || 'La película que buscas no existe'}</p>
          <button onClick={() => navigate('/peliculas')} className="btn-primary">
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  // Calcular fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0]
  // Calcular fecha máxima (30 días desde hoy)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <div className="container py-8 px-4 sm:px-6 lg:px-8">
      {/* Mensaje de éxito */}
      {rentalSuccess && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-5 py-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">¡Película alquilada exitosamente!</span>
            </div>
            <button
              onClick={() => setRentalSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/peliculas')}
        className="mb-8 text-primary-600 hover:text-primary-700 flex items-center px-3 py-2 rounded-md hover:bg-primary-50 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver al catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información de la película */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-8 p-8">
              {/* Imagen */}
              <div className="flex-shrink-0">
                {movie.imagen ? (
                  <img
                    src={movie.imagen}
                    alt={movie.titulo}
                    className="w-full md:w-64 h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full md:w-64 h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center ${movie.imagen ? 'hidden' : 'flex'}`}
                >
                  <svg className="w-24 h-24 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Detalles */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-3">{movie.titulo}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full font-medium">
                        {movie.tipo}
                      </span>
                      <span className="text-gray-600">{movie.genero}</span>
                      <span className="text-gray-600">{movie.anio}</span>
                    </div>
                    {movie.precio_dia && (
                      <div className="mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Precio por día</p>
                              <p className="text-2xl font-bold text-green-700">
                                {formatearPrecio(movie.precio_dia)}
                              </p>
                            </div>
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {movie.descripcion && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900">Sinopsis</h2>
                    <p className="text-gray-700 leading-relaxed text-base">{movie.descripcion}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                  {checkingRental ? (
                    <button disabled className="btn-primary px-6 py-3 opacity-50 cursor-not-allowed">
                      Verificando...
                    </button>
                  ) : currentRental ? (
                    <>
                      <button
                        onClick={handleCancelRental}
                        disabled={submitting}
                        className="btn-outline px-6 py-3 border-red-500 text-red-600 hover:bg-red-50"
                      >
                        {submitting ? 'Cancelando...' : 'Cancelar alquiler'}
                      </button>
                      <button
                        onClick={() => {
                          setShowExtendForm(true)
                          setShowRentalForm(false)
                        }}
                        disabled={submitting}
                        className="btn-primary px-6 py-3"
                      >
                        Extender alquiler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login')
                          return
                        }
                        setShowRentalForm(!showRentalForm)
                        setShowExtendForm(false)
                      }}
                      className="btn-primary px-6 py-3"
                    >
                      {showRentalForm ? 'Cancelar' : 'Alquilar película'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/peliculas')}
                    className="btn-outline px-6 py-3"
                  >
                    Ver más películas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formularios de alquiler y extensión */}
        <div className="lg:col-span-1">
          {/* Formulario de extensión */}
          {showExtendForm && currentRental && (
            <div className="card sticky top-4">
              <div className="card-header pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Extender Alquiler</h2>
                  <button
                    onClick={() => {
                      setShowExtendForm(false)
                      setExtendFormData({
                        dias_adicionales: '7',
                        metodo_pago: 'tarjeta'
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="card-content pt-0">
                <form onSubmit={handleExtendRental} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días adicionales
                    </label>
                    <input
                      type="number"
                      name="dias_adicionales"
                      value={extendFormData.dias_adicionales}
                      onChange={handleExtendInputChange}
                      min="1"
                      max="30"
                      required
                      className="input"
                      placeholder="Ingresa el número de días"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago
                    </label>
                    <select
                      name="metodo_pago"
                      value={extendFormData.metodo_pago}
                      onChange={handleExtendInputChange}
                      className="input"
                      required
                    >
                      <option value="tarjeta">Tarjeta de crédito</option>
                      <option value="debito">Tarjeta de débito</option>
                      <option value="paypal">PayPal</option>
                      <option value="transferencia">Transferencia bancaria</option>
                    </select>
                  </div>

                  {/* Resumen de precio */}
                  {extendFormData.dias_adicionales && movie?.precio_dia && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 mb-3">Resumen de la Extensión</h3>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Precio por día:</span>
                        <span className="font-medium">{formatearPrecio(parseFloat(movie.precio_dia))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Días adicionales:</span>
                        <span className="font-medium">{extendFormData.dias_adicionales} {parseInt(extendFormData.dias_adicionales) === 1 ? 'día' : 'días'}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Total a pagar:</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatearPrecio(calcularMontoExtension())}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 mt-2"
                  >
                    {submitting ? 'Extendiendo...' : 'Confirmar Extensión'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Formulario de alquiler */}
          {showRentalForm && (
            <div className="card sticky top-4">
              <div className="card-header pb-4">
                <h2 className="text-xl font-semibold">Formulario de Alquiler</h2>
              </div>
              <div className="card-content pt-0">
                {!isAuthenticated ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">Debes iniciar sesión para alquilar</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="btn-primary w-full"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRental} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        name="fecha_inicio"
                        value={formData.fecha_inicio}
                        onChange={handleInputChange}
                        min={today}
                        max={maxDateStr}
                        required
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        name="fecha_fin"
                        value={formData.fecha_fin}
                        onChange={handleInputChange}
                        min={formData.fecha_inicio || today}
                        max={maxDateStr}
                        required
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de pago
                      </label>
                      <select
                        name="metodo_pago"
                        value={formData.metodo_pago}
                        onChange={handleInputChange}
                        className="input"
                        required
                      >
                        <option value="tarjeta">Tarjeta de crédito</option>
                        <option value="debito">Tarjeta de débito</option>
                        <option value="paypal">PayPal</option>
                        <option value="transferencia">Transferencia bancaria</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleInputChange}
                        rows="3"
                        className="input"
                        placeholder="Cualquier información adicional..."
                      />
                    </div>

                    {/* Resumen de precio */}
                    {formData.fecha_inicio && formData.fecha_fin && movie?.precio_dia && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-gray-900 mb-3">Resumen del Alquiler</h3>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Precio por día:</span>
                          <span className="font-medium">{formatearPrecio(movie.precio_dia)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Días de alquiler:</span>
                          <span className="font-medium">{diasAlquiler} {diasAlquiler === 1 ? 'día' : 'días'}</span>
                        </div>
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Total a pagar:</span>
                            <span className="text-2xl font-bold text-primary-600">
                              {formatearPrecio(precioTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !formData.fecha_inicio || !formData.fecha_fin}
                      className="btn-primary w-full py-3 mt-2"
                    >
                      {submitting ? 'Procesando...' : precioTotal > 0 ? `Confirmar Alquiler - ${formatearPrecio(precioTotal)}` : 'Confirmar Alquiler'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {!showRentalForm && !showExtendForm && !rentalSuccess && (
            <div className="card">
              <div className="card-content text-center py-8">
                <svg className="w-16 h-16 text-primary-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">
                  {currentRental 
                    ? 'Haz clic en "Extender alquiler" para agregar más días' 
                    : 'Haz clic en "Alquilar película" para comenzar'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

