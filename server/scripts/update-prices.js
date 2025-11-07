/**
 * Script para actualizar precios de películas de forma dinámica
 * Basado en tipo, año, género y otros factores
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';
import { calcularPrecioDia } from '../utils/priceCalculator.js';

/**
 * Calcula el precio por día basado en diferentes factores
 * @deprecated Usar calcularPrecioDia de utils/priceCalculator.js
 */
function calcularPrecioDiaOld(pelicula) {
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
      precioBase = 12000;
      break;
    case 'serie':
      precioBase = 10000;
      break;
    case 'juego':
      precioBase = 15000;
      break;
    default:
      precioBase = 10000;
  }

  // Ajuste por antigüedad
  let multiplicadorAntiguedad = 1.0;
  if (antiguedad <= 1) {
    // Estrenos muy recientes (último año)
    multiplicadorAntiguedad = 1.5;
  } else if (antiguedad <= 3) {
    // Películas recientes (2-3 años)
    multiplicadorAntiguedad = 1.3;
  } else if (antiguedad <= 5) {
    // Películas relativamente nuevas (4-5 años)
    multiplicadorAntiguedad = 1.1;
  } else if (antiguedad <= 10) {
    // Películas medianas (6-10 años)
    multiplicadorAntiguedad = 1.0;
  } else if (antiguedad <= 20) {
    // Películas antiguas (11-20 años)
    multiplicadorAntiguedad = 0.8;
  } else {
    // Películas muy antiguas (más de 20 años)
    multiplicadorAntiguedad = 0.6;
  }

  // Ajuste por género (algunos géneros son más populares/caros)
  let multiplicadorGenero = 1.0;
  const generoLower = genero.toLowerCase();
  if (generoLower.includes('acción') || generoLower.includes('accion') || generoLower.includes('action')) {
    multiplicadorGenero = 1.2;
  } else if (generoLower.includes('terror') || generoLower.includes('horror')) {
    multiplicadorGenero = 1.1;
  } else if (generoLower.includes('ciencia ficción') || generoLower.includes('sci-fi') || generoLower.includes('fantasía') || generoLower.includes('fantasia')) {
    multiplicadorGenero = 1.15;
  } else if (generoLower.includes('documental') || generoLower.includes('documentary')) {
    multiplicadorGenero = 0.7;
  } else if (generoLower.includes('animación') || generoLower.includes('animacion') || generoLower.includes('animation')) {
    multiplicadorGenero = 0.9;
  }

  // Calcular precio final
  let precioFinal = precioBase * multiplicadorAntiguedad * multiplicadorGenero;

  // Redondear a múltiplos de 500 para precios más limpios
  precioFinal = Math.round(precioFinal / 500) * 500;

  // Precio mínimo y máximo
  precioFinal = Math.max(3000, Math.min(30000, precioFinal));

  return precioFinal;
}

async function updatePrices() {
  try {
    console.log('💰 Actualizando precios de películas...\n');

    // Obtener todas las películas
    const peliculas = await query('SELECT id_pelicula, titulo, tipo, anio, genero FROM Peliculas');
    
    console.log(`📊 Total de películas a actualizar: ${peliculas.rows.length}\n`);

    let actualizadas = 0;
    let errores = 0;

    for (const pelicula of peliculas.rows) {
      try {
        const nuevoPrecio = calcularPrecioDia({
          tipo: pelicula.tipo,
          anio: pelicula.anio,
          genero: pelicula.genero
        });
        
        await query(
          'UPDATE Peliculas SET precio_dia = $1 WHERE id_pelicula = $2',
          [nuevoPrecio, pelicula.id_pelicula]
        );

        actualizadas++;
        
        // Mostrar algunas actualizaciones como ejemplo
        if (actualizadas <= 10 || actualizadas % 100 === 0) {
          console.log(`   ${actualizadas}. ${pelicula.titulo.substring(0, 40)} - $${nuevoPrecio.toLocaleString()} (${pelicula.tipo}, ${pelicula.anio || 'N/A'})`);
        }
      } catch (err) {
        errores++;
        console.error(`   ❌ Error actualizando ${pelicula.titulo}:`, err.message);
      }
    }

    console.log(`\n✅ Actualización completada:`);
    console.log(`   - Películas actualizadas: ${actualizadas}`);
    console.log(`   - Errores: ${errores}`);

    // Mostrar estadísticas de precios
    const stats = await query(`
      SELECT 
        MIN(precio_dia) as precio_min,
        MAX(precio_dia) as precio_max,
        AVG(precio_dia) as precio_promedio,
        COUNT(*) as total
      FROM Peliculas
      WHERE precio_dia IS NOT NULL
    `);

    if (stats.rows[0]) {
      const stat = stats.rows[0];
      console.log(`\n📈 Estadísticas de precios:`);
      console.log(`   - Precio mínimo: $${parseFloat(stat.precio_min).toLocaleString()}`);
      console.log(`   - Precio máximo: $${parseFloat(stat.precio_max).toLocaleString()}`);
      console.log(`   - Precio promedio: $${parseFloat(stat.precio_promedio).toFixed(0)}`);
      console.log(`   - Total con precio: ${stat.total}`);
    }

    // Mostrar distribución por tipo
    const porTipo = await query(`
      SELECT 
        tipo,
        COUNT(*) as cantidad,
        AVG(precio_dia) as precio_promedio,
        MIN(precio_dia) as precio_min,
        MAX(precio_dia) as precio_max
      FROM Peliculas
      WHERE precio_dia IS NOT NULL
      GROUP BY tipo
      ORDER BY tipo
    `);

    if (porTipo.rows.length > 0) {
      console.log(`\n📊 Distribución por tipo:`);
      porTipo.rows.forEach(row => {
        console.log(`   ${row.tipo}:`);
        console.log(`     - Cantidad: ${row.cantidad}`);
        console.log(`     - Precio promedio: $${parseFloat(row.precio_promedio).toFixed(0)}`);
        console.log(`     - Rango: $${parseFloat(row.precio_min).toLocaleString()} - $${parseFloat(row.precio_max).toLocaleString()}`);
      });
    }

    await closePostgresPool();
    console.log('\n✅ Proceso completado exitosamente');
    
  } catch (err) {
    console.error('\n❌ Error en el proceso:', err);
    console.error('   Mensaje:', err.message);
    await closePostgresPool();
    process.exit(1);
  }
}

updatePrices();

