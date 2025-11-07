import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export default function Juegos() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    q: '',
    genero: '',
    anio: '',
    tipo: 'Juego' // Filtro fijo para juegos
  })

  useEffect(() => {
    loadJuegos()
  }, [filters])

  const loadJuegos = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.movies.list(filters)
      setItems(data)
    } catch (error) {
      setError('Error al cargar juegos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRent = (juego) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Navegar a la página de detalle para alquilar
    navigate(`/peliculas/${juego.id_pelicula}/alquilar`)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Juegos</h1>
        <p className="text-gray-600">Descubre los mejores juegos para todas las plataformas</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-8">
        <div className="card-content">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Título del juego..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={filters.genero}
                onChange={(e) => handleFilterChange('genero', e.target.value)}
                className="input"
              >
                <option value="">Todos los géneros</option>
                <option value="Acción">Acción</option>
                <option value="Aventura">Aventura</option>
                <option value="Estrategia">Estrategia</option>
                <option value="RPG">RPG</option>
                <option value="Deportes">Deportes</option>
                <option value="Carreras">Carreras</option>
                <option value="Puzzle">Puzzle</option>
                <option value="Simulación">Simulación</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <input
                type="number"
                placeholder="Año de lanzamiento"
                value={filters.anio}
                onChange={(e) => handleFilterChange('anio', e.target.value)}
                className="input"
                min="1990"
                max="2030"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando juegos...</p>
        </div>
      )}

      {/* Juegos Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((juego) => (
            <div key={juego.id_pelicula} className="card group hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="relative">
                {juego.imagen ? (
                  <img
                    src={juego.imagen}
                    alt={juego.titulo}
                    className="w-full h-64 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-64 bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center ${juego.imagen ? 'hidden' : 'flex'}`}
                >
                  <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    Juego
                  </span>
                </div>
              </div>
              
              <div className="card-content flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                  {juego.titulo}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>{juego.genero}</span>
                  <span>{juego.anio}</span>
                </div>
                {juego.precio_dia && (
                  <div className="mb-3">
                    <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(parseFloat(juego.precio_dia))}/día
                    </div>
                  </div>
                )}
                {juego.descripcion && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                    {juego.descripcion}
                  </p>
                )}
                <div className="flex space-x-2 mt-auto pt-2">
                  <button
                    onClick={() => handleRent(juego)}
                    className="btn-primary flex-1 text-sm"
                  >
                    {isAuthenticated ? 'Alquilar' : 'Inicia sesión para alquilar'}
                  </button>
                  <button className="btn-outline text-sm">
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron juegos</h3>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  )
}

