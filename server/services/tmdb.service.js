/**
 * Servicio para interactuar con The Movie Database (TMDb) API
 * 
 * Para obtener tu API key gratuita:
 * 1. Visita: https://www.themoviedb.org/settings/api
 * 2. Crea una cuenta (gratis)
 * 3. Solicita una API key
 * 4. Agrega la key a tu archivo .env como TMDB_API_KEY=tu_api_key_aqui
 * 
 * Documentación: https://developers.themoviedb.org/3
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Mapea los géneros de TMDb a los géneros del sistema
 */
const mapGenre = (genreIds, allGenres) => {
  const genreMap = {
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

  if (genreIds && genreIds.length > 0) {
    const genreId = genreIds[0];
    return genreMap[genreId] || 'Drama';
  }
  return 'Drama';
};

/**
 * Genera una descripción por defecto basada en el tipo, género y año
 */
function generarDescripcionPorDefecto(pelicula) {
  const tipo = pelicula.tipo || 'Película';
  const genero = pelicula.genero || 'Drama';
  const anio = pelicula.anio || new Date().getFullYear();
  
  const descripcionesGenero = {
    'Acción': `Una emocionante ${tipo.toLowerCase()} de acción del año ${anio}. Llena de adrenalina, combates intensos y momentos de suspenso que mantendrán al espectador al borde de su asiento.`,
    'Terror': `Una ${tipo.toLowerCase()} de terror del año ${anio} que te mantendrá despierto por las noches. Con elementos sobrenaturales y situaciones aterradoras que desafiarán tus miedos más profundos.`,
    'Ciencia Ficción': `Una ${tipo.toLowerCase()} de ciencia ficción del año ${anio} que explora mundos futuros, tecnología avanzada y conceptos que desafían la realidad. Una experiencia visual y conceptual única.`,
    'Fantasía': `Una ${tipo.toLowerCase()} de fantasía del año ${anio} que te transportará a mundos mágicos y épicos. Con criaturas fantásticas, aventuras increíbles y personajes memorables.`,
    'Drama': `Una ${tipo.toLowerCase()} dramática del año ${anio} que explora temas profundos y emocionales. Con actuaciones destacadas y una narrativa que conecta con las emociones del espectador.`,
    'Comedia': `Una ${tipo.toLowerCase()} cómica del año ${anio} llena de risas y situaciones divertidas. Perfecta para disfrutar en familia o con amigos.`,
    'Aventura': `Una ${tipo.toLowerCase()} de aventura del año ${anio} que te llevará a lugares exóticos y situaciones emocionantes. Con acción, exploración y momentos inolvidables.`,
    'Romance': `Una ${tipo.toLowerCase()} romántica del año ${anio} que explora el amor y las relaciones humanas. Con momentos emotivos y una historia que toca el corazón.`,
    'Suspense': `Una ${tipo.toLowerCase()} de suspense del año ${anio} llena de giros inesperados y tensión constante. Mantendrá al espectador adivinando hasta el final.`,
    'Documental': `Un documental del año ${anio} que explora temas reales e importantes. Con información valiosa y una perspectiva única sobre el mundo que nos rodea.`
  };
  
  // Buscar descripción por género
  for (const [key, desc] of Object.entries(descripcionesGenero)) {
    if (genero.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(genero.toLowerCase())) {
      return desc;
    }
  }
  
  // Descripción genérica si no coincide con ningún género
  return `Una ${tipo.toLowerCase()} del género ${genero} del año ${anio}. Una producción que ofrece entretenimiento y calidad para todos los gustos.`;
}

/**
 * Obtiene películas populares de TMDb
 */
export async function getPopularMovies(page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${apiKey}&language=es-ES&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Función para calcular precio
    const calcularPrecio = (anio, tipo, rating = 5) => {
      const anioActual = new Date().getFullYear();
      const antiguedad = anioActual - anio;
      let precioBase = tipo === 'Serie' ? 8000 : 10000;
      
      if (antiguedad <= 2) precioBase *= 1.5;
      else if (antiguedad <= 5) precioBase *= 1.2;
      else if (antiguedad > 20) precioBase *= 0.7;
      
      const ratingMultiplier = 1 + (rating - 5) * 0.06;
      precioBase *= Math.max(0.7, Math.min(1.3, ratingMultiplier));
      
      return Math.round(precioBase / 500) * 500;
    };
    
    return data.results.map(movie => {
      const anio = movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear();
      const genero = mapGenre(movie.genre_ids);
      
      // Generar descripción por defecto si TMDb no la proporciona
      let descripcion = movie.overview || '';
      if (!descripcion || descripcion.trim() === '') {
        descripcion = generarDescripcionPorDefecto({
          tipo: 'Película',
          genero: genero,
          anio: anio
        });
      }
      
      return {
        id_pelicula: movie.id,
        titulo: movie.title,
        genero: genero,
        tipo: 'Película',
        anio: anio,
        descripcion: descripcion,
        imagen: movie.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
          : '',
        tmdb_id: movie.id,
        rating: movie.vote_average,
        fecha_lanzamiento: movie.release_date,
        precio_dia: calcularPrecio(anio, 'Película', movie.vote_average || 5)
      };
    });
  } catch (error) {
    console.error('Error al obtener películas de TMDb:', error);
    throw error;
  }
}

/**
 * Obtiene series populares de TMDb
 */
export async function getPopularTVShows(page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${apiKey}&language=es-ES&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Función para calcular precio
    const calcularPrecio = (anio, tipo, rating = 5) => {
      const anioActual = new Date().getFullYear();
      const antiguedad = anioActual - anio;
      let precioBase = tipo === 'Serie' ? 8000 : 10000;
      
      if (antiguedad <= 2) precioBase *= 1.5;
      else if (antiguedad <= 5) precioBase *= 1.2;
      else if (antiguedad > 20) precioBase *= 0.7;
      
      const ratingMultiplier = 1 + (rating - 5) * 0.06;
      precioBase *= Math.max(0.7, Math.min(1.3, ratingMultiplier));
      
      return Math.round(precioBase / 500) * 500;
    };
    
    return data.results.map(show => {
      const anio = show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear();
      const genero = mapGenre(show.genre_ids);
      
      // Generar descripción por defecto si TMDb no la proporciona
      let descripcion = show.overview || '';
      if (!descripcion || descripcion.trim() === '') {
        descripcion = generarDescripcionPorDefecto({
          tipo: 'Serie',
          genero: genero,
          anio: anio
        });
      }
      
      return {
        id_pelicula: show.id,
        titulo: show.name,
        genero: genero,
        tipo: 'Serie',
        anio: anio,
        descripcion: descripcion,
        imagen: show.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` 
          : '',
        tmdb_id: show.id,
        rating: show.vote_average,
        fecha_lanzamiento: show.first_air_date,
        precio_dia: calcularPrecio(anio, 'Serie', show.vote_average || 5)
      };
    });
  } catch (error) {
    console.error('Error al obtener series de TMDb:', error);
    throw error;
  }
}

/**
 * Busca películas o series por nombre
 */
export async function searchMovies(query, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map(movie => {
      const anio = movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear();
      const genero = mapGenre(movie.genre_ids);
      
      // Generar descripción por defecto si TMDb no la proporciona
      let descripcion = movie.overview || '';
      if (!descripcion || descripcion.trim() === '') {
        descripcion = generarDescripcionPorDefecto({
          tipo: 'Película',
          genero: genero,
          anio: anio
        });
      }
      
      return {
        id_pelicula: movie.id,
        titulo: movie.title,
        genero: genero,
        tipo: 'Película',
        anio: anio,
        descripcion: descripcion,
        imagen: movie.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
          : '',
        tmdb_id: movie.id,
        rating: movie.vote_average,
        fecha_lanzamiento: movie.release_date
      };
    });
  } catch (error) {
    console.error('Error al buscar películas en TMDb:', error);
    throw error;
  }
}

/**
 * Busca series por nombre
 */
export async function searchTVShows(query, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map(show => {
      const anio = show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear();
      const genero = mapGenre(show.genre_ids);
      
      // Generar descripción por defecto si TMDb no la proporciona
      let descripcion = show.overview || '';
      if (!descripcion || descripcion.trim() === '') {
        descripcion = generarDescripcionPorDefecto({
          tipo: 'Serie',
          genero: genero,
          anio: anio
        });
      }
      
      return {
        id_pelicula: show.id,
        titulo: show.name,
        genero: genero,
        tipo: 'Serie',
        anio: anio,
        descripcion: descripcion,
        imagen: show.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` 
          : '',
        tmdb_id: show.id,
        rating: show.vote_average,
        fecha_lanzamiento: show.first_air_date
      };
    });
  } catch (error) {
    console.error('Error al buscar series en TMDb:', error);
    throw error;
  }
}

/**
 * Obtiene detalles completos de una película por ID de TMDb
 */
export async function getMovieDetails(tmdbId) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const movie = await response.json();
    
    // Calcular precio por día
    const calcularPrecio = (anio, tipo, rating = 5) => {
      const anioActual = new Date().getFullYear();
      const antiguedad = anioActual - anio;
      let precioBase = tipo === 'Serie' ? 8000 : 10000;
      
      if (antiguedad <= 2) precioBase *= 1.5;
      else if (antiguedad <= 5) precioBase *= 1.2;
      else if (antiguedad > 20) precioBase *= 0.7;
      
      const ratingMultiplier = 1 + (rating - 5) * 0.06;
      precioBase *= Math.max(0.7, Math.min(1.3, ratingMultiplier));
      
      return Math.round(precioBase / 500) * 500;
    };
    
    const anio = movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear();
    
    const genero = movie.genres && movie.genres.length > 0 
      ? movie.genres[0].name 
      : 'Drama';
    
    // Generar descripción por defecto si TMDb no la proporciona
    let descripcion = movie.overview || '';
    if (!descripcion || descripcion.trim() === '') {
      descripcion = generarDescripcionPorDefecto({
        tipo: 'Película',
        genero: genero,
        anio: anio
      });
    }
    
    return {
      id_pelicula: movie.id,
      titulo: movie.title,
      genero: genero,
      tipo: 'Película',
      anio: anio,
      descripcion: descripcion,
      imagen: movie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
        : '',
      tmdb_id: movie.id,
      rating: movie.vote_average,
      fecha_lanzamiento: movie.release_date,
      duracion: movie.runtime,
      presupuesto: movie.budget,
      ingresos: movie.revenue,
      generos: movie.genres || [],
      precio_dia: calcularPrecio(anio, 'Película', movie.vote_average || 5)
    };
  } catch (error) {
    console.error('Error al obtener detalles de película:', error);
    throw error;
  }
}

/**
 * Obtiene detalles completos de una serie por ID de TMDb
 */
export async function getTVShowDetails(tmdbId) {
  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no está configurada en el archivo .env');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&language=es-ES`
    );

    if (!response.ok) {
      throw new Error(`Error de TMDb API: ${response.status} ${response.statusText}`);
    }

    const show = await response.json();
    
    // Calcular precio por día
    const calcularPrecio = (anio, tipo, rating = 5) => {
      const anioActual = new Date().getFullYear();
      const antiguedad = anioActual - anio;
      let precioBase = tipo === 'Serie' ? 8000 : 10000;
      
      if (antiguedad <= 2) precioBase *= 1.5;
      else if (antiguedad <= 5) precioBase *= 1.2;
      else if (antiguedad > 20) precioBase *= 0.7;
      
      const ratingMultiplier = 1 + (rating - 5) * 0.06;
      precioBase *= Math.max(0.7, Math.min(1.3, ratingMultiplier));
      
      return Math.round(precioBase / 500) * 500;
    };
    
    const anio = show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear();
    
    const genero = show.genres && show.genres.length > 0 
      ? show.genres[0].name 
      : 'Drama';
    
    // Generar descripción por defecto si TMDb no la proporciona
    let descripcion = show.overview || '';
    if (!descripcion || descripcion.trim() === '') {
      descripcion = generarDescripcionPorDefecto({
        tipo: 'Serie',
        genero: genero,
        anio: anio
      });
    }
    
    return {
      id_pelicula: show.id,
      titulo: show.name,
      genero: genero,
      tipo: 'Serie',
      anio: anio,
      descripcion: descripcion,
      imagen: show.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` 
        : '',
      tmdb_id: show.id,
      rating: show.vote_average,
      fecha_lanzamiento: show.first_air_date,
      temporadas: show.number_of_seasons,
      episodios: show.number_of_episodes,
      generos: show.genres || [],
      precio_dia: calcularPrecio(anio, 'Serie', show.vote_average || 5)
    };
  } catch (error) {
    console.error('Error al obtener detalles de serie:', error);
    throw error;
  }
}

/**
 * Calcula el precio por día basado en el año y tipo
 */
function calcularPrecioDia(anio, tipo, rating = 5) {
  const anioActual = new Date().getFullYear();
  const antiguedad = anioActual - anio;
  
  // Precio base según tipo
  let precioBase = tipo === 'Serie' ? 8000 : 10000; // Series más baratas
  
  // Ajuste por antigüedad (más nuevo = más caro)
  if (antiguedad <= 2) {
    precioBase *= 1.5; // Muy reciente: +50%
  } else if (antiguedad <= 5) {
    precioBase *= 1.2; // Reciente: +20%
  } else if (antiguedad > 20) {
    precioBase *= 0.7; // Antigua: -30%
  }
  
  // Ajuste por rating (mejor rating = más caro, hasta +30%)
  const ratingMultiplier = 1 + (rating - 5) * 0.06; // 0.06% por punto de rating
  precioBase *= Math.max(0.7, Math.min(1.3, ratingMultiplier)); // Limitar entre 70% y 130%
  
  // Redondear a múltiplos de 500
  return Math.round(precioBase / 500) * 500;
}

/**
 * Pobla el sistema con películas populares desde TMDb
 */
export async function populateMoviesFromTMDB(limit = 20) {
  try {
    const movies = await getPopularMovies(1);
    const limited = movies.slice(0, limit);
    
    // Transformar para que coincida con la estructura del sistema
    return limited.map(movie => ({
      titulo: movie.titulo,
      genero: movie.genero,
      tipo: movie.tipo,
      anio: movie.anio,
      descripcion: movie.descripcion,
      imagen: movie.imagen,
      precio_dia: calcularPrecioDia(movie.anio || new Date().getFullYear(), movie.tipo, movie.rating || 5)
    }));
  } catch (error) {
    console.error('Error al poblar películas:', error);
    throw error;
  }
}

/**
 * Pobla el sistema con series populares desde TMDb
 */
export async function populateTVShowsFromTMDB(limit = 20) {
  try {
    const shows = await getPopularTVShows(1);
    const limited = shows.slice(0, limit);
    
    // Transformar para que coincida con la estructura del sistema
    return limited.map(show => ({
      titulo: show.titulo,
      genero: show.genero,
      tipo: show.tipo,
      anio: show.anio,
      descripcion: show.descripcion,
      imagen: show.imagen,
      precio_dia: calcularPrecioDia(show.anio || new Date().getFullYear(), show.tipo, show.rating || 5)
    }));
  } catch (error) {
    console.error('Error al poblar series:', error);
    throw error;
  }
}

