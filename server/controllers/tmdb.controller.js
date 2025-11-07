/**
 * Controlador para poblar datos desde TMDb API
 */
import * as tmdbService from '../services/tmdb.service.js';
import { query } from '../config/postgres.js';
import { calcularPrecioDia } from '../utils/priceCalculator.js';

/**
 * Pobla películas populares desde TMDb
 */
export async function populateMovies(req, res) {
  try {
    const { limit = 20 } = req.query;
    
    const movies = await tmdbService.populateMoviesFromTMDB(Number(limit));
    
    // Agregar las películas al sistema
    const addedMovies = [];
    for (const movie of movies) {
      try {
        // Calcular precio dinámico
        const precioDia = calcularPrecioDia(movie);
        
        const result = await query(
          'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [movie.titulo, movie.genero, movie.tipo, movie.anio, movie.descripcion || '', movie.imagen || '', precioDia]
        );
        addedMovies.push(result.rows[0]);
      } catch (err) {
        // Si la película ya existe (duplicado), continuar
        console.warn(`Película duplicada: ${movie.titulo}`);
      }
    }
    
    res.json({
      ok: true,
      message: `Se agregaron ${addedMovies.length} películas desde TMDb`,
      peliculas: addedMovies
    });
  } catch (error) {
    console.error('Error al poblar películas:', error);
    res.status(500).json({
      error: error.message || 'Error al poblar películas desde TMDb'
    });
  }
}

/**
 * Pobla series populares desde TMDb
 */
export async function populateTVShows(req, res) {
  try {
    const { limit = 20 } = req.query;
    
    const shows = await tmdbService.populateTVShowsFromTMDB(Number(limit));
    
    // Agregar las series al sistema
    const addedShows = [];
    for (const show of shows) {
      try {
        // Calcular precio dinámico
        const precioDia = calcularPrecioDia(show);
        
        const result = await query(
          'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [show.titulo, show.genero, show.tipo, show.anio, show.descripcion || '', show.imagen || '', precioDia]
        );
        addedShows.push(result.rows[0]);
      } catch (err) {
        // Si la serie ya existe (duplicado), continuar
        console.warn(`Serie duplicada: ${show.titulo}`);
      }
    }
    
    res.json({
      ok: true,
      message: `Se agregaron ${addedShows.length} series desde TMDb`,
      series: addedShows
    });
  } catch (error) {
    console.error('Error al poblar series:', error);
    res.status(500).json({
      error: error.message || 'Error al poblar series desde TMDb'
    });
  }
}

/**
 * Busca películas en TMDb
 */
export async function searchMovies(req, res) {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parámetro "q" (query) es requerido' });
    }
    
    const movies = await tmdbService.searchMovies(q, Number(page));
    
    res.json({
      ok: true,
      resultados: movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error al buscar películas:', error);
    res.status(500).json({
      error: error.message || 'Error al buscar películas en TMDb'
    });
  }
}

/**
 * Busca series en TMDb
 */
export async function searchTVShows(req, res) {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parámetro "q" (query) es requerido' });
    }
    
    const shows = await tmdbService.searchTVShows(q, Number(page));
    
    res.json({
      ok: true,
      resultados: shows,
      total: shows.length
    });
  } catch (error) {
    console.error('Error al buscar series:', error);
    res.status(500).json({
      error: error.message || 'Error al buscar series en TMDb'
    });
  }
}

/**
 * Obtiene películas populares de TMDb (sin agregar al sistema)
 */
export async function getPopularMovies(req, res) {
  try {
    const { page = 1 } = req.query;
    
    const movies = await tmdbService.getPopularMovies(Number(page));
    
    res.json({
      ok: true,
      peliculas: movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error al obtener películas populares:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener películas populares de TMDb'
    });
  }
}

/**
 * Obtiene series populares de TMDb (sin agregar al sistema)
 */
export async function getPopularTVShows(req, res) {
  try {
    const { page = 1 } = req.query;
    
    const shows = await tmdbService.getPopularTVShows(Number(page));
    
    res.json({
      ok: true,
      series: shows,
      total: shows.length
    });
  } catch (error) {
    console.error('Error al obtener series populares:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener series populares de TMDb'
    });
  }
}

/**
 * Agrega una película específica desde TMDb al sistema
 */
export async function addMovieFromTMDB(req, res) {
  try {
    const { tmdb_id } = req.body;
    
    if (!tmdb_id) {
      return res.status(400).json({ error: 'tmdb_id es requerido' });
    }
    
    const movieDetails = await tmdbService.getMovieDetails(tmdb_id);
    
    // Transformar al formato del sistema
    const movieData = {
      titulo: movieDetails.titulo,
      genero: movieDetails.genero,
      tipo: movieDetails.tipo,
      anio: movieDetails.anio,
      descripcion: movieDetails.descripcion,
      imagen: movieDetails.imagen
    };
    
    // Calcular precio dinámico
    const precioDia = calcularPrecioDia(movieData);
    
    const result = await query(
      'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [movieData.titulo, movieData.genero, movieData.tipo, movieData.anio, movieData.descripcion || '', movieData.imagen || '', precioDia]
    );
    
    res.json({
      ok: true,
      message: 'Película agregada exitosamente',
      pelicula: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar película:', error);
    res.status(500).json({
      error: error.message || 'Error al agregar película desde TMDb'
    });
  }
}

/**
 * Agrega una serie específica desde TMDb al sistema
 */
export async function addTVShowFromTMDB(req, res) {
  try {
    const { tmdb_id } = req.body;
    
    if (!tmdb_id) {
      return res.status(400).json({ error: 'tmdb_id es requerido' });
    }
    
    const showDetails = await tmdbService.getTVShowDetails(tmdb_id);
    
    // Transformar al formato del sistema
    const showData = {
      titulo: showDetails.titulo,
      genero: showDetails.genero,
      tipo: showDetails.tipo,
      anio: showDetails.anio,
      descripcion: showDetails.descripcion,
      imagen: showDetails.imagen
    };
    
    // Calcular precio dinámico
    const precioDia = calcularPrecioDia(showData);
    
    const result = await query(
      'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [showData.titulo, showData.genero, showData.tipo, showData.anio, showData.descripcion || '', showData.imagen || '', precioDia]
    );
    
    res.json({
      ok: true,
      message: 'Serie agregada exitosamente',
      serie: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar serie:', error);
    res.status(500).json({
      error: error.message || 'Error al agregar serie desde TMDb'
    });
  }
}




