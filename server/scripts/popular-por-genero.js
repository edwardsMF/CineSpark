/**
 * Script para poblar películas y series por género
 * Asegura que cada género tenga contenido disponible
 * Uso: node scripts/popular-por-genero.js
 */

import 'dotenv/config';
import { query } from '../config/postgres.js';
import { calcularPrecioDia } from '../utils/priceCalculator.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const DELAY_BETWEEN_REQUESTS = 250; // 250ms entre requests

// Mapeo de géneros del sistema a IDs de TMDb
const GENERO_TO_TMDB_ID = {
  'Acción': 28,
  'Aventura': 12,
  'Animación': 16,
  'Comedia': 35,
  'Crimen': 80,
  'Documental': 99,
  'Drama': 18,
  'Familia': 10751,
  'Fantasía': 14,
  'Historia': 36,
  'Terror': 27,
  'Música': 10402,
  'Misterio': 9648,
  'Romance': 10749,
  'Ciencia Ficción': 878,
  'TV': 10770,
  'Suspense': 53,
  'Guerra': 10752,
  'Western': 37
};

// Mapeo de IDs de TMDb a géneros del sistema
const TMDB_ID_TO_GENERO = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia Ficción',
  10770: 'TV',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Western'
};

/**
 * Obtiene películas por género desde TMDb
 */
async function getMoviesByGenre(genreId, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&language=es-ES&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map(movie => {
      const anio = movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear();
      
      // Obtener el género principal del mapeo
      const genero = TMDB_ID_TO_GENERO[genreId] || 'Drama';
      
      return {
        id_pelicula: movie.id,
        titulo: movie.title,
        genero: genero,
        tipo: 'Película',
        anio: anio,
        descripcion: movie.overview || `Una película de ${genero} del año ${anio}.`,
        imagen: movie.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
          : '',
        tmdb_id: movie.id,
        rating: movie.vote_average || 5
      };
    });
  } catch (error) {
    console.error(`Error al obtener películas de género ${genreId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene series por género desde TMDb
 */
async function getTVShowsByGenre(genreId, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/tv?api_key=${apiKey}&language=es-ES&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map(show => {
      const anio = show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear();
      
      // Obtener el género principal del mapeo
      const genero = TMDB_ID_TO_GENERO[genreId] || 'Drama';
      
      return {
        id_pelicula: show.id,
        titulo: show.name,
        genero: genero,
        tipo: 'Serie',
        anio: anio,
        descripcion: show.overview || `Una serie de ${genero} del año ${anio}.`,
        imagen: show.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` 
          : '',
        tmdb_id: show.id,
        rating: show.vote_average || 5
      };
    });
  } catch (error) {
    console.error(`Error al obtener series de género ${genreId}:`, error.message);
    throw error;
  }
}

/**
 * Verifica si una película/serie ya existe en la base de datos
 */
async function existsInDatabase(titulo) {
  try {
    const result = await query(
      'SELECT id_pelicula FROM Peliculas WHERE titulo = $1',
      [titulo]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error al verificar existencia:', error);
    return false;
  }
}

/**
 * Agrega una película o serie a la base de datos
 */
async function addToDatabase(item) {
  try {
    const precioDia = calcularPrecioDia({
      tipo: item.tipo,
      anio: item.anio,
      genero: item.genero
    });
    
    await query(
      'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [item.titulo, item.genero, item.tipo, item.anio, item.descripcion || '', item.imagen || '', precioDia]
    );
    return true;
  } catch (error) {
    console.warn(`Error al agregar ${item.titulo}:`, error.message);
    return false;
  }
}

/**
 * Pobla contenido para un género específico
 */
async function populateGenre(genre, minItems = 5) {
  const genreId = GENERO_TO_TMDB_ID[genre];
  
  if (!genreId) {
    console.warn(`⚠️  Género "${genre}" no tiene mapeo a TMDb, omitiendo...`);
    return { movies: 0, series: 0 };
  }

  console.log(`\n📂 Poblando género: ${genre}...`);
  
  let moviesAdded = 0;
  let seriesAdded = 0;
  let page = 1;
  let hasMore = true;

  // Poblar películas
  console.log(`   🎬 Buscando películas de ${genre}...`);
  while (moviesAdded < minItems && hasMore && page <= 3) {
    try {
      const movies = await getMoviesByGenre(genreId, page);
      
      if (movies.length === 0) {
        hasMore = false;
        break;
      }

      for (const movie of movies) {
        if (moviesAdded >= minItems) break;
        
        const exists = await existsInDatabase(movie.titulo);
        if (!exists) {
          const added = await addToDatabase(movie);
          if (added) {
            moviesAdded++;
            console.log(`      ✅ Agregada: ${movie.titulo} (${movie.anio})`);
          }
        }
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    } catch (error) {
      console.error(`      ❌ Error en página ${page}:`, error.message);
      hasMore = false;
    }
  }

  // Poblar series
  page = 1;
  hasMore = true;
  console.log(`   📺 Buscando series de ${genre}...`);
  while (seriesAdded < minItems && hasMore && page <= 3) {
    try {
      const shows = await getTVShowsByGenre(genreId, page);
      
      if (shows.length === 0) {
        hasMore = false;
        break;
      }

      for (const show of shows) {
        if (seriesAdded >= minItems) break;
        
        const exists = await existsInDatabase(show.titulo);
        if (!exists) {
          const added = await addToDatabase(show);
          if (added) {
            seriesAdded++;
            console.log(`      ✅ Agregada: ${show.titulo} (${show.anio})`);
          }
        }
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    } catch (error) {
      console.error(`      ❌ Error en página ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`   ✅ ${genre}: ${moviesAdded} películas, ${seriesAdded} series`);
  return { movies: moviesAdded, series: seriesAdded };
}

/**
 * Función principal
 */
async function main() {
  // Verificar API key
  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === 'tu_api_key_aqui') {
    console.error('❌ Error: TMDB_API_KEY no está configurada en el archivo .env');
    console.error('   Configura tu API key de TMDb para usar este script');
    process.exit(1);
  }

  console.log('🚀 Iniciando población de contenido por género...\n');
  console.log('📊 Este proceso puede tardar varios minutos debido a los límites de la API\n');

  const generos = Object.keys(GENERO_TO_TMDB_ID);
  const minItemsPerGenre = 5; // Mínimo de películas y series por género

  let totalMovies = 0;
  let totalSeries = 0;

  for (const genero of generos) {
    try {
      const result = await populateGenre(genero, minItemsPerGenre);
      totalMovies += result.movies;
      totalSeries += result.series;
    } catch (error) {
      console.error(`❌ Error al poblar género ${genero}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Proceso completado!');
  console.log(`📽️  Total películas agregadas: ${totalMovies}`);
  console.log(`📺 Total series agregadas: ${totalSeries}`);
  console.log(`📊 Total: ${totalMovies + totalSeries} títulos`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});



