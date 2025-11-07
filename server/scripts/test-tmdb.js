/**
 * Script de prueba para verificar la conexión con TMDb API
 * 
 * Uso: node scripts/test-tmdb.js
 */

import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('❌ Error: TMDB_API_KEY no está configurada en el archivo .env');
  console.log('\n📝 Por favor, crea un archivo .env en la carpeta server/ con:');
  console.log('TMDB_API_KEY=2d3eb2d96bdd618293688ddd62567e2a\n');
  process.exit(1);
}

console.log('🔍 Probando conexión con TMDb API...\n');
console.log(`API Key: ${TMDB_API_KEY.substring(0, 10)}...\n`);

async function testTMDB() {
  try {
    // Probar obteniendo películas populares
    console.log('📡 Obteniendo películas populares...');
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=es-ES&page=1`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
      console.error(`Detalles: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ ¡Conexión exitosa con TMDb API!\n');
    console.log(`📊 Resultados encontrados: ${data.results.length} películas`);
    console.log(`📄 Página: ${data.page} de ${data.total_pages}`);
    console.log(`📈 Total de películas disponibles: ${data.total_results}\n`);
    
    console.log('🎬 Primeras 5 películas populares:');
    data.results.slice(0, 5).forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${new Date(movie.release_date).getFullYear()})`);
    });
    
    console.log('\n✅ ¡La API key está funcionando correctamente!');
    console.log('🎉 Puedes usar los endpoints de TMDb en tu aplicación.\n');
    
  } catch (error) {
    console.error('❌ Error al conectar con TMDb API:');
    console.error(error.message);
    process.exit(1);
  }
}

testTMDB();





