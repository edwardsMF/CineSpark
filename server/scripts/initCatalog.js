/**
 * Script de inicialización del catálogo
 * Se ejecuta automáticamente al iniciar el servidor
 * Pobla el catálogo con películas y series desde TMDb si está configurado
 * Carga la máxima cantidad posible respetando los límites de la API
 */

import 'dotenv/config';
import * as tmdbService from '../services/tmdb.service.js';
import { query } from '../config/postgres.js';
import { calcularPrecioDia } from '../utils/priceCalculator.js';

// Configuración de páginas a cargar (cada página tiene ~20 resultados)
const MAX_MOVIES_PAGES = parseInt(process.env.INIT_MOVIES_PAGES) || 50; // ~1000 películas
const MAX_TV_PAGES = parseInt(process.env.INIT_TV_PAGES) || 50; // ~1000 series
const DELAY_BETWEEN_REQUESTS = 250; // 250ms entre requests (40 requests/10s = 1 cada 250ms)

/**
 * Verifica si el catálogo ya tiene contenido
 */
async function hasContent() {
  try {
    const result = await query('SELECT COUNT(*) as count FROM Peliculas');
    return parseInt(result.rows[0].count) > 10;
  } catch (err) {
    console.error('Error al verificar contenido:', err);
    return false;
  }
}

/**
 * Pobla películas desde TMDb cargando múltiples páginas
 */
async function populateMovies() {
  try {
    console.log(`📽️  Cargando películas populares desde TMDb (máximo ${MAX_MOVIES_PAGES} páginas)...`);
    
    let totalAdded = 0;
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages && currentPage <= MAX_MOVIES_PAGES) {
      try {
        // Obtener películas de la página actual
        const movies = await tmdbService.getPopularMovies(currentPage);
        
        if (movies.length === 0) {
          hasMorePages = false;
          break;
        }
        
        // Agregar películas al catálogo
        let pageAdded = 0;
        for (const movie of movies) {
          try {
            // Verificar si la película ya existe (por título)
            const existing = await query(
              'SELECT id_pelicula FROM Peliculas WHERE titulo = $1',
              [movie.titulo]
            );
            
            if (existing.rows.length === 0) {
              // Calcular precio dinámico
              const precioDia = calcularPrecioDia(movie);
              
              // Insertar película
              await query(
                'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [movie.titulo, movie.genero, movie.tipo, movie.anio, movie.descripcion || '', movie.imagen || '', precioDia]
              );
              pageAdded++;
              totalAdded++;
            }
          } catch (err) {
            // Si hay error (duplicado u otro), continuar
            console.warn(`Error al agregar película ${movie.titulo}:`, err.message);
          }
        }
        
        console.log(`   Página ${currentPage}: ${pageAdded} películas nuevas agregadas (Total: ${totalAdded})`);
        
        currentPage++;
        
        // Esperar entre requests para respetar rate limiting
        if (hasMorePages && currentPage <= MAX_MOVIES_PAGES) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
      } catch (error) {
        console.error(`⚠️  Error al cargar página ${currentPage} de películas:`, error.message);
        // Continuar con la siguiente página
        currentPage++;
        if (currentPage > MAX_MOVIES_PAGES) {
          hasMorePages = false;
        }
      }
    }
    
    console.log(`✅ Total: ${totalAdded} películas agregadas al catálogo`);
    return totalAdded;
  } catch (error) {
    console.error('⚠️  Error al poblar películas:', error.message);
    return 0;
  }
}

/**
 * Pobla series desde TMDb cargando múltiples páginas
 */
async function populateTVShows() {
  try {
    console.log(`📺 Cargando series populares desde TMDb (máximo ${MAX_TV_PAGES} páginas)...`);
    
    let totalAdded = 0;
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages && currentPage <= MAX_TV_PAGES) {
      try {
        // Obtener series de la página actual
        const shows = await tmdbService.getPopularTVShows(currentPage);
        
        if (shows.length === 0) {
          hasMorePages = false;
          break;
        }
        
        // Agregar series al catálogo
        let pageAdded = 0;
        for (const show of shows) {
          try {
            // Verificar si la serie ya existe (por título)
            const existing = await query(
              'SELECT id_pelicula FROM Peliculas WHERE titulo = $1',
              [show.titulo]
            );
            
            if (existing.rows.length === 0) {
              // Calcular precio dinámico
              const precioDia = calcularPrecioDia(show);
              
              // Insertar serie
              await query(
                'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [show.titulo, show.genero, show.tipo, show.anio, show.descripcion || '', show.imagen || '', precioDia]
              );
              pageAdded++;
              totalAdded++;
            }
          } catch (err) {
            // Si hay error (duplicado u otro), continuar
            console.warn(`Error al agregar serie ${show.titulo}:`, err.message);
          }
        }
        
        console.log(`   Página ${currentPage}: ${pageAdded} series nuevas agregadas (Total: ${totalAdded})`);
        
        currentPage++;
        
        // Esperar entre requests para respetar rate limiting
        if (hasMorePages && currentPage <= MAX_TV_PAGES) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
      } catch (error) {
        console.error(`⚠️  Error al cargar página ${currentPage} de series:`, error.message);
        // Continuar con la siguiente página
        currentPage++;
        if (currentPage > MAX_TV_PAGES) {
          hasMorePages = false;
        }
      }
    }
    
    console.log(`✅ Total: ${totalAdded} series agregadas al catálogo`);
    return totalAdded;
  } catch (error) {
    console.error('⚠️  Error al poblar series:', error.message);
    return 0;
  }
}

/**
 * Inicializa el catálogo al arrancar el servidor
 */
export async function initializeCatalog() {
  // Verificar si TMDb está configurado
  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === 'tu_api_key_aqui') {
    console.log('ℹ️  TMDb API key no configurada. Omitiendo carga inicial de catálogo.');
    console.log('   Para habilitar, configura TMDB_API_KEY en tu archivo .env');
    return;
  }

  // Verificar si ya hay contenido
  if (await hasContent()) {
    console.log('ℹ️  El catálogo ya tiene contenido. Omitiendo carga inicial.');
    return;
  }

  console.log('\n🚀 Inicializando catálogo desde TMDb...');
  console.log(`📊 Configuración: ${MAX_MOVIES_PAGES} páginas de películas, ${MAX_TV_PAGES} páginas de series`);
  console.log(`⏱️  Esto puede tomar varios minutos debido a los límites de la API...\n`);

  try {
    const startTime = Date.now();
    
    // Poblar películas
    const moviesAdded = await populateMovies();
    
    console.log(''); // Línea en blanco
    
    // Poblar series
    const seriesAdded = await populateTVShows();

    const total = moviesAdded + seriesAdded;
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (total > 0) {
      console.log(`\n✅ Catálogo inicializado exitosamente!`);
      console.log(`   📽️  ${moviesAdded} películas agregadas`);
      console.log(`   📺 ${seriesAdded} series agregadas`);
      console.log(`   📊 Total: ${total} títulos`);
      console.log(`   ⏱️  Tiempo: ${elapsedTime} segundos\n`);
    } else {
      console.log('\n⚠️  No se agregaron nuevos títulos al catálogo\n');
    }
  } catch (error) {
    console.error('\n❌ Error durante la inicialización del catálogo:', error.message);
    console.log('   El servidor continuará funcionando con los datos existentes.\n');
  }
}

