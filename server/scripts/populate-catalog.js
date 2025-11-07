/**
 * Script para poblar el catálogo con películas y series desde TMDb
 * 
 * Uso: node scripts/populate-catalog.js [movies|tv|both] [limit]
 * 
 * Ejemplos:
 *   node scripts/populate-catalog.js movies 20
 *   node scripts/populate-catalog.js tv 15
 *   node scripts/populate-catalog.js both 30
 */

import 'dotenv/config';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const ADMIN_EMAIL = 'admin@cinespark.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

async function login() {
  try {
    console.log('🔐 Iniciando sesión como administrador...');
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: ADMIN_EMAIL,
        contrasena: ADMIN_PASSWORD
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Sesión iniciada correctamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error.message);
    return false;
  }
}

async function populateMovies(limit = 20) {
  try {
    console.log(`📽️ Poblando ${limit} películas populares...`);
    const response = await fetch(`${SERVER_URL}/api/tmdb/populate/movies?limit=${limit}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al poblar películas');
    }

    const data = await response.json();
    console.log(`✅ ${data.message}`);
    
    if (data.peliculas && data.peliculas.length > 0) {
      console.log('\n🎬 Películas agregadas:');
      data.peliculas.slice(0, 5).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.titulo} (${movie.anio || 'N/A'})`);
      });
      if (data.peliculas.length > 5) {
        console.log(`   ... y ${data.peliculas.length - 5} más`);
      }
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error al poblar películas:', error.message);
    return false;
  }
}

async function populateTVShows(limit = 20) {
  try {
    console.log(`📺 Poblando ${limit} series populares...`);
    const response = await fetch(`${SERVER_URL}/api/tmdb/populate/tv?limit=${limit}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al poblar series');
    }

    const data = await response.json();
    console.log(`✅ ${data.message}`);
    
    if (data.series && data.series.length > 0) {
      console.log('\n📺 Series agregadas:');
      data.series.slice(0, 5).forEach((show, index) => {
        console.log(`   ${index + 1}. ${show.titulo} (${show.anio || 'N/A'})`);
      });
      if (data.series.length > 5) {
        console.log(`   ... y ${data.series.length - 5} más`);
      }
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error al poblar series:', error.message);
    return false;
  }
}

async function main() {
  const type = process.argv[2] || 'both';
  const limit = parseInt(process.argv[3]) || 20;

  console.log('🚀 Script de Población de Catálogo desde TMDb\n');
  console.log(`📊 Configuración:`);
  console.log(`   Tipo: ${type}`);
  console.log(`   Límite: ${limit}`);
  console.log(`   Servidor: ${SERVER_URL}\n`);

  // Verificar que el servidor esté corriendo
  try {
    const healthCheck = await fetch(`${SERVER_URL}/api/health`);
    if (!healthCheck.ok) {
      throw new Error('Servidor no responde');
    }
  } catch (error) {
    console.error('❌ Error: El servidor no está corriendo en', SERVER_URL);
    console.log('\n💡 Inicia el servidor primero con: npm run dev\n');
    process.exit(1);
  }

  // Iniciar sesión
  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  // Poblar según el tipo
  let success = true;

  if (type === 'movies' || type === 'both') {
    success = await populateMovies(limit) && success;
  }

  if (type === 'tv' || type === 'both') {
    success = await populateTVShows(limit) && success;
  }

  if (success) {
    console.log('🎉 ¡Catálogo poblado exitosamente!');
    console.log('\n💡 Puedes verificar las películas en:');
    console.log(`   GET ${SERVER_URL}/api/movies\n`);
  } else {
    console.log('⚠️ Algunos errores ocurrieron durante el poblamiento');
    process.exit(1);
  }
}

main();

