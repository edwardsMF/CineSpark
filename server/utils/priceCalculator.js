/**
 * Utilidad para calcular precios dinámicos de películas
 */

/**
 * Calcula el precio por día basado en diferentes factores
 * @param {Object} pelicula - Objeto con propiedades: tipo, anio, genero
 * @returns {number} Precio calculado
 */
export function calcularPrecioDia(pelicula) {
  const anioActual = new Date().getFullYear();
  const anio = pelicula.anio || anioActual;
  const antiguedad = anioActual - anio;
  const tipo = pelicula.tipo || 'Película';
  const genero = pelicula.genero || '';

  // Precio base según tipo
  let precioBase = 0;
  switch (tipo.toLowerCase()) {
    case 'película':
    case 'pelicula':
    case 'movie':
      precioBase = 12000; // Precio original para películas
      break;
    case 'serie':
    case 'tv':
    case 'tv show':
      precioBase = 2500; // Precio ajustado para series ($1,000 - $5,000)
      break;
    case 'juego':
    case 'game':
      precioBase = 15000; // Precio original para juegos
      break;
    default:
      precioBase = 2500;
  }

  // Ajuste por antigüedad
  let multiplicadorAntiguedad = 1.0;
  const esPelicula = tipo.toLowerCase() === 'película' || tipo.toLowerCase() === 'pelicula' || tipo.toLowerCase() === 'movie';
  
  if (esPelicula) {
    // Multiplicadores originales para películas
    if (antiguedad <= 1) {
      multiplicadorAntiguedad = 1.5;
    } else if (antiguedad <= 3) {
      multiplicadorAntiguedad = 1.3;
    } else if (antiguedad <= 5) {
      multiplicadorAntiguedad = 1.1;
    } else if (antiguedad <= 10) {
      multiplicadorAntiguedad = 1.0;
    } else if (antiguedad <= 20) {
      multiplicadorAntiguedad = 0.8;
    } else {
      multiplicadorAntiguedad = 0.6;
    }
  } else {
    // Multiplicadores ajustados para series (mantener rango $1,000 - $5,000)
    if (antiguedad <= 1) {
      multiplicadorAntiguedad = 1.4;
    } else if (antiguedad <= 3) {
      multiplicadorAntiguedad = 1.2;
    } else if (antiguedad <= 5) {
      multiplicadorAntiguedad = 1.0;
    } else if (antiguedad <= 10) {
      multiplicadorAntiguedad = 0.9;
    } else if (antiguedad <= 20) {
      multiplicadorAntiguedad = 0.7;
    } else {
      multiplicadorAntiguedad = 0.5;
    }
  }

  // Ajuste por género
  let multiplicadorGenero = 1.0;
  const generoLower = genero.toLowerCase();
  
  if (esPelicula) {
    // Multiplicadores originales para películas
    if (generoLower.includes('acción') || generoLower.includes('accion') || generoLower.includes('action')) {
      multiplicadorGenero = 1.2;
    } else if (generoLower.includes('terror') || generoLower.includes('horror')) {
      multiplicadorGenero = 1.1;
    } else if (generoLower.includes('ciencia ficción') || generoLower.includes('sci-fi') || generoLower.includes('fantasía') || generoLower.includes('fantasia') || generoLower.includes('science fiction') || generoLower.includes('fantasy')) {
      multiplicadorGenero = 1.15;
    } else if (generoLower.includes('documental') || generoLower.includes('documentary')) {
      multiplicadorGenero = 0.7;
    } else if (generoLower.includes('animación') || generoLower.includes('animacion') || generoLower.includes('animation')) {
      multiplicadorGenero = 0.9;
    }
  } else {
    // Multiplicadores ajustados para series (mantener rango $1,000 - $5,000)
    if (generoLower.includes('acción') || generoLower.includes('accion') || generoLower.includes('action')) {
      multiplicadorGenero = 1.15;
    } else if (generoLower.includes('terror') || generoLower.includes('horror')) {
      multiplicadorGenero = 1.1;
    } else if (generoLower.includes('ciencia ficción') || generoLower.includes('sci-fi') || generoLower.includes('fantasía') || generoLower.includes('fantasia') || generoLower.includes('science fiction') || generoLower.includes('fantasy')) {
      multiplicadorGenero = 1.12;
    } else if (generoLower.includes('documental') || generoLower.includes('documentary')) {
      multiplicadorGenero = 0.6;
    } else if (generoLower.includes('animación') || generoLower.includes('animacion') || generoLower.includes('animation')) {
      multiplicadorGenero = 0.8;
    }
  }

  // Calcular precio final
  let precioFinal = precioBase * multiplicadorAntiguedad * multiplicadorGenero;

  if (esPelicula) {
    // Para películas: redondear a múltiplos de 500 y mantener rango original
    precioFinal = Math.round(precioFinal / 500) * 500;
    precioFinal = Math.max(3000, Math.min(30000, precioFinal));
  } else {
    // Para series: redondear a múltiplos de 100 y mantener rango $1,000 - $5,000
    precioFinal = Math.round(precioFinal / 100) * 100;
    precioFinal = Math.max(1000, Math.min(5000, precioFinal));
  }

  return precioFinal;
}

