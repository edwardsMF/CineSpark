# 🎬 Poblar Catálogo con TMDb

## ✅ API Key Verificada

Tu API key de TMDb está funcionando correctamente:
- ✅ Conexión exitosa
- ✅ 1,069,343 películas disponibles
- ✅ Miles de series disponibles

## 🚀 Formas de Poblar el Catálogo

### Opción 1: Poblar por Género (Recomendado para filtros)

Este script asegura que cada género tenga contenido disponible (películas y series):

```bash
cd server
node scripts/popular-por-genero.js
```

**¿Qué hace?**
- Busca películas y series populares para cada género
- Agrega al menos 5 películas y 5 series por género
- Usa la API de TMDb para obtener contenido real
- Evita duplicados automáticamente

**Géneros incluidos:**
- Acción, Aventura, Animación, Comedia, Crimen
- Documental, Drama, Familia, Fantasía, Historia
- Terror, Música, Misterio, Romance, Ciencia Ficción
- TV, Suspense, Guerra, Western

**Nota:** Este proceso puede tardar varios minutos debido a los límites de la API de TMDb.

### Opción 2: Script Automático (Población general)

**Prerrequisitos:**
1. El servidor debe estar corriendo (`npm run dev` en otra terminal)

**Comandos:**

```bash
# Poblar solo películas (20 por defecto)
node scripts/populate-catalog.js movies

# Poblar solo series (20 por defecto)
node scripts/populate-catalog.js tv

# Poblar películas y series (20 cada uno)
node scripts/populate-catalog.js both

# Especificar cantidad
node scripts/populate-catalog.js movies 50
node scripts/populate-catalog.js tv 30
node scripts/populate-catalog.js both 40
```

### Opción 2: Manualmente con cURL

**1. Iniciar sesión como admin:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@cinespark.com","contrasena":"admin123"}'
```

**2. Copiar el token de la respuesta y usarlo:**

```bash
# Poblar películas
curl -X POST "http://localhost:4000/api/tmdb/populate/movies?limit=20" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"

# Poblar series
curl -X POST "http://localhost:4000/api/tmdb/populate/tv?limit=20" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### Opción 3: Desde el Frontend (React)

```javascript
// Función para poblar catálogo
const populateCatalog = async (type = 'movies', limit = 20) => {
  // 1. Iniciar sesión
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: 'admin@cinespark.com',
      contrasena: 'admin123'
    })
  });
  
  const { token } = await loginResponse.json();
  
  // 2. Poblar datos
  const populateResponse = await fetch(
    `http://localhost:4000/api/tmdb/populate/${type}?limit=${limit}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await populateResponse.json();
  console.log(result.message);
  return result;
};

// Uso
await populateCatalog('movies', 20);  // Películas
await populateCatalog('tv', 15);       // Series
```

## 📊 Verificar Datos Poblados

Después de poblar, puedes verificar las películas:

```bash
# Ver todas las películas (requiere autenticación)
curl http://localhost:4000/api/movies \
  -H "Authorization: Bearer TU_TOKEN"
```

## 🎯 Ejemplos de Uso

### Poblar 50 películas populares:
```bash
node scripts/populate-catalog.js movies 50
```

### Poblar 30 series populares:
```bash
node scripts/populate-catalog.js tv 30
```

### Poblar 40 películas y 40 series:
```bash
node scripts/populate-catalog.js both 40
```

## ⚠️ Notas Importantes

1. **Límites de TMDb**: 40 requests cada 10 segundos
   - El script maneja esto automáticamente
   - Si poblas muchas películas, puede tomar tiempo

2. **Datos en Memoria**: Los datos se guardan en memoria (mockData)
   - Si reinicias el servidor, los datos se perderán
   - Para persistencia, necesitarías conectar a una base de datos

3. **Imágenes**: Las imágenes se cargan directamente desde TMDb CDN
   - URLs públicas, no requieren autenticación
   - Formato: `https://image.tmdb.org/t/p/w500/[poster_path]`

## 🔍 Explorar Sin Poblar

Puedes explorar películas y series sin agregarlas al sistema:

```bash
# Películas populares (sin autenticación)
curl http://localhost:4000/api/tmdb/movies/popular

# Series populares (sin autenticación)
curl http://localhost:4000/api/tmdb/tv/popular

# Buscar películas
curl "http://localhost:4000/api/tmdb/movies/search?q=inception"

# Buscar series
curl "http://localhost:4000/api/tmdb/tv/search?q=breaking+bad"
```

## 📝 Credenciales de Admin

- **Email**: `admin@cinespark.com`
- **Password**: `admin123`

## 🎉 ¡Listo!

Con estos métodos puedes poblar tu catálogo con miles de películas y series reales de TMDb.

