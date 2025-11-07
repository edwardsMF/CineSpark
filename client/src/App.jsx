import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Peliculas from './pages/Peliculas.jsx'
import PeliculaDetalle from './pages/PeliculaDetalle.jsx'
import Series from './pages/Series.jsx'
import Perfil from './pages/Perfil.jsx'
import Admin from './pages/Admin.jsx'
import Soporte from './pages/Soporte.jsx'

function Navigation() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (isAuthenticated === false) {
    return (
      <nav className="bg-white shadow-lg border-b">
        <div className="container">
          <div className="flex items-center justify-between h-20 px-4">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-primary-600 py-2">
                CineSpark
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="btn-outline">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container">
        <div className="flex items-center justify-between h-20 px-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary-600 py-2">
              CineSpark
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/peliculas" className="text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                Películas
              </Link>
              <Link to="/series" className="text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                Series
              </Link>
              <Link to="/perfil" className="text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                Mi Perfil
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                  Admin
                </Link>
              )}
              <Link to="/soporte" className="text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                Soporte
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 px-2">
              Hola, {user?.nombre ? user.nombre.split(' ')[0] : 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              className="btn-outline text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/peliculas" element={<Peliculas />} />
          <Route path="/peliculas/:id" element={<PeliculaDetalle />} />
          <Route path="/peliculas/:id/alquilar" element={<PeliculaDetalle />} />
          <Route path="/series" element={<Series />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/soporte/*" element={<Soporte />} />
        </Routes>
      </main>
    </div>
  )
}

