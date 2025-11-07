import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export default function Admin() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [movies, setMovies] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estados para formularios
  const [movieForm, setMovieForm] = useState({
    titulo: '',
    genero: '',
    tipo: 'Película',
    anio: new Date().getFullYear(),
    descripcion: '',
    imagen: ''
  })
  const [editingMovie, setEditingMovie] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      setLoading(true)
      const [moviesData, ticketsData] = await Promise.all([
        api.movies.list(),
        api.soporte.getAllTickets()
      ])
      setMovies(moviesData)
      setTickets(ticketsData)
    } catch (error) {
      setError('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMovieSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingMovie) {
        await api.movies.update(editingMovie.id_pelicula, movieForm)
      } else {
        await api.movies.create(movieForm)
      }
      setMovieForm({
        titulo: '',
        genero: '',
        tipo: 'Película',
        anio: new Date().getFullYear(),
        descripcion: '',
        imagen: ''
      })
      setEditingMovie(null)
      await loadData()
    } catch (error) {
      setError('Error al guardar película: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMovie = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return
    
    try {
      setLoading(true)
      await api.movies.delete(id)
      await loadData()
    } catch (error) {
      setError('Error al eliminar película: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMovie = (movie) => {
    setEditingMovie(movie)
    setMovieForm({
      titulo: movie.titulo,
      genero: movie.genero,
      tipo: movie.tipo,
      anio: movie.anio,
      descripcion: movie.descripcion || '',
      imagen: movie.imagen || ''
    })
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona películas, tickets y más</p>
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
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movies'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Películas
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tickets
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Películas</p>
                  <p className="text-2xl font-semibold text-gray-900">{movies.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tickets Cerrados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {tickets.filter(t => t.estado === 'Cerrado').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tickets Abiertos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {tickets.filter(t => t.estado === 'Abierto').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movies Tab */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          {/* Add/Edit Movie Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">
                {editingMovie ? 'Editar Película' : 'Agregar Nueva Película'}
              </h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleMovieSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={movieForm.titulo}
                      onChange={(e) => setMovieForm({...movieForm, titulo: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género
                    </label>
                    <select
                      value={movieForm.genero}
                      onChange={(e) => setMovieForm({...movieForm, genero: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar género</option>
                      <option value="Acción">Acción</option>
                      <option value="Terror">Terror</option>
                      <option value="Ciencia Ficción">Ciencia Ficción</option>
                      <option value="Fantasía">Fantasía</option>
                      <option value="Aventura">Aventura</option>
                      <option value="Comedia">Comedia</option>
                      <option value="Drama">Drama</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={movieForm.tipo}
                      onChange={(e) => setMovieForm({...movieForm, tipo: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="Película">Película</option>
                      <option value="Serie">Serie</option>
                      <option value="Juego">Juego</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={movieForm.anio}
                      onChange={(e) => setMovieForm({...movieForm, anio: parseInt(e.target.value)})}
                      className="input"
                      min="1900"
                      max="2030"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={movieForm.descripcion}
                    onChange={(e) => setMovieForm({...movieForm, descripcion: e.target.value})}
                    className="input"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={movieForm.imagen}
                    onChange={(e) => setMovieForm({...movieForm, imagen: e.target.value})}
                    className="input"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Guardando...' : (editingMovie ? 'Actualizar' : 'Agregar')}
                  </button>
                  {editingMovie && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMovie(null)
                        setMovieForm({
                          titulo: '',
                          genero: '',
                          tipo: 'Película',
                          anio: new Date().getFullYear(),
                          descripcion: '',
                          imagen: ''
                        })
                      }}
                      className="btn-outline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Movies List */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Lista de Películas</h3>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Género
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movies.map((movie) => (
                      <tr key={movie.id_pelicula}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movie.titulo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movie.genero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movie.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movie.anio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditMovie(movie)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(movie.id_pelicula)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Tickets de Soporte</h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id_ticket}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ticket.id_ticket}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.asunto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.estado === 'Abierto' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.fecha_creacion).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

