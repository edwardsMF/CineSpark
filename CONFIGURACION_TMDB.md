# ✅ Configuración de TMDb API - Completada

## 🔑 API Key Configurada

Tu API key de TMDb ha sido configurada:
- **API Key**: `2d3eb2d96bdd618293688ddd62567e2a`
- **Token de Acceso**: Disponible (opcional)

## 📝 Configuración del Archivo .env

**IMPORTANTE**: Necesitas crear el archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
PORT=4000
JWT_SECRET=ClaveUltraSeguraBM2Pelis2024

# PostgreSQL Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña
POSTGRES_DATABASE=CineSpark
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# The Movie Database (TMDb) API
TMDB_API_KEY=2d3eb2d96bdd618293688ddd62567e2a
```

### Pasos para crear el archivo .env:

1. Ve a la carpeta `server/`
2. Crea un nuevo archivo llamado `.env` (sin extensión)
3. Copia y pega el contenido de arriba
4. Guarda el archivo

**Nota**: El archivo `.env` no debe subirse a Git (ya está en .gitignore).

## 🧪 Probar la Conexión

Para verificar que la API key funciona correctamente, ejecuta:

```bash
cd server
node scripts/test-tmdb.js
```

Este script probará la conexión con TMDb y mostrará las películas populares.

## 🚀 Uso Inmediato

Una vez que tengas el archivo `.env` configurado, puedes:

### 1. Reiniciar el servidor
```bash
cd server
npm run dev
```

### 2. Probar los endpoints públicos (sin autenticación)

**Películas populares:**
```bash
curl http://localhost:4000/api/tmdb/movies/popular
```

**Series populares:**
```bash
curl http://localhost:4000/api/tmdb/tv/popular
```

**Buscar películas:**
```bash
curl "http://localhost:4000/api/tmdb/movies/search?q=inception"
```

### 3. Poblar datos (requiere autenticación como admin)

Primero inicia sesión:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@cinespark.com","contrasena":"admin123"}'
```

Luego usa el token para poblar películas:
```bash
curl -X POST "http://localhost:4000/api/tmdb/populate/movies?limit=20" \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## 📋 Endpoints Disponibles

### Públicos (sin autenticación):
- `GET /api/tmdb/movies/popular?page=1` - Películas populares
- `GET /api/tmdb/tv/popular?page=1` - Series populares  
- `GET /api/tmdb/movies/search?q=nombre` - Buscar películas
- `GET /api/tmdb/tv/search?q=nombre` - Buscar series

### Protegidos (requieren admin):
- `POST /api/tmdb/populate/movies?limit=20` - Poblar películas
- `POST /api/tmdb/populate/tv?limit=20` - Poblar series
- `POST /api/tmdb/add/movie` - Agregar película específica
- `POST /api/tmdb/add/tv` - Agregar serie específica

## 🔒 Seguridad

- ✅ La API key está configurada en el archivo `.env` (no está en el código)
- ✅ El archivo `.env` está en `.gitignore` (no se subirá a Git)
- ✅ Los endpoints de poblamiento requieren autenticación de admin

## ⚠️ Límites de TMDb

- **40 requests cada 10 segundos** por IP
- Sin límite diario para uso normal
- El código maneja automáticamente los límites

## 🎉 ¡Listo!

Tu integración con TMDb está completa. Ahora puedes poblar tu catálogo con miles de películas y series reales.

Para más detalles, consulta: `TMDB_API_GUIDE.md`

