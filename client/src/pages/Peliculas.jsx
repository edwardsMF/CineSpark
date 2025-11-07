import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

const ITEMS_PER_PAGE = 12

export default function Peliculas() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    q: '',
    genero: '',
    anio: '',
    tipo: 'Película'
  })

  // Cargar todas las películas al montar
  useEffect(() => {
    loadAllMovies()
  }, [])

  // Filtrar cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1) // Resetear a página 1 cuando cambian los filtros
  }, [filters])

  const loadAllMovies = async () => {
    try {
      setLoading(true)
      setError('')
      // Cargar todas las películas sin filtros para tener todos los datos disponibles
      const data = await api.movies.list({})
      setAllItems(data)
    } catch (error) {
      setError('Error al cargar películas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Obtener géneros únicos de las películas
  const availableGenres = useMemo(() => {
    const genres = new Set()
    allItems.forEach(item => {
      if (item.genero) {
        genres.add(item.genero)
      }
    })
    return Array.from(genres).sort()
  }, [allItems])

  // Obtener años únicos
  const availableYears = useMemo(() => {
    const years = new Set()
    allItems.forEach(item => {
      if (item.anio) {
        years.add(item.anio)
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [allItems])

  // Filtrar películas según los filtros
  const filteredItems = useMemo(() => {
    let result = [...allItems]

    // Filtro de búsqueda por título
    if (filters.q) {
      const q = filters.q.toLowerCase()
      result = result.filter(item => 
        item.titulo?.toLowerCase().includes(q)
      )
    }

    // Filtro de género
    if (filters.genero) {
      result = result.filter(item => item.genero === filters.genero)
    }

    // Filtro de año
    if (filters.anio) {
      const year = Number(filters.anio)
      result = result.filter(item => item.anio === year)
    }

    // Filtro de tipo
    if (filters.tipo) {
      result = result.filter(item => item.tipo === filters.tipo)
    }

    return result
  }, [allItems, filters])

  // Paginación
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage])

  const handleRent = (movie) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Navegar a la página de detalle para alquilar
    navigate(`/peliculas/${movie.id_pelicula}/alquilar`)
  }

  const handleViewDetails = (movie) => {
    navigate(`/peliculas/${movie.id_pelicula}`)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Películas</h1>
        <p className="text-gray-600">Descubre las mejores películas para alquilar</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Título de la película..."
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
                {availableGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <select
                value={filters.anio}
                onChange={(e) => handleFilterChange('anio', e.target.value)}
                className="input"
              >
                <option value="">Todos los años</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="input"
              >
                <option value="Película">Película</option>
                <option value="Serie">Serie</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando películas...</p>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedItems.map((movie) => (
            <div key={movie.id_pelicula} className="card group hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="relative">
                {movie.imagen ? (
                  <img
                    src={movie.imagen}
                    alt={movie.titulo}
                    className="w-full h-64 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg flex items-center justify-center ${movie.imagen ? 'hidden' : 'flex'}`}
                >
                  <svg className="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {movie.tipo}
                  </span>
                </div>
              </div>
              
              <div className="card-content pt-0 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-3 group-hover:text-primary-600 transition-colors">
                  {movie.titulo}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{movie.genero}</span>
                  <span>{movie.anio}</span>
                </div>
                {movie.precio_dia && (
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
                      }).format(movie.precio_dia)}/día
                    </div>
                  </div>
                )}
                {movie.descripcion && (
                  <p className="text-sm text-gray-600 mb-5 line-clamp-2 flex-grow">
                    {movie.descripcion}
                  </p>
                )}
                <div className="flex space-x-3 mt-auto pt-2">
                  <button
                    onClick={() => handleRent(movie)}
                    className="btn-primary flex-1 text-sm py-2.5"
                  >
                    {isAuthenticated ? 'Alquilar' : 'Inicia sesión para alquilar'}
                  </button>
                  <button 
                    onClick={() => handleViewDetails(movie)}
                    className="btn-outline text-sm py-2.5 px-4"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Mostrar primera, última, actual y adyacentes
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="px-2 text-gray-500">...</span>
                  }
                  return null
                })}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Info de paginación */}
          {filteredItems.length > 0 && (
            <div className="text-center mt-4 text-sm text-gray-600">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} películas
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.576M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron películas</h3>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  )
}

