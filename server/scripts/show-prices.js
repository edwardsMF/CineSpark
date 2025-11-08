/**
 * Script para mostrar ejemplos de precios variados
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

async function showPrices() {
  try {
    console.log('💰 Mostrando ejemplos de precios variados...\n');
    
    // Top 10 más caras
    const masCaras = await query(`
      SELECT id_pelicula, titulo, tipo, anio, precio_dia 
      FROM Peliculas 
      ORDER BY precio_dia DESC 
      LIMIT 10
    `);
    
    console.log('🏆 Top 10 más caras:');
    masCaras.rows.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.titulo.substring(0, 45)}`);
      console.log(`      Tipo: ${p.tipo}, Año: ${p.anio || 'N/A'}, Precio: $${parseFloat(p.precio_dia).toLocaleString()}/día\n`);
    });
    
    // Top 10 más baratas
    const masBaratas = await query(`
      SELECT id_pelicula, titulo, tipo, anio, precio_dia 
      FROM Peliculas 
      ORDER BY precio_dia ASC 
      LIMIT 10
    `);
    
    console.log('💵 Top 10 más baratas:');
    masBaratas.rows.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.titulo.substring(0, 45)}`);
      console.log(`      Tipo: ${p.tipo}, Año: ${p.anio || 'N/A'}, Precio: $${parseFloat(p.precio_dia).toLocaleString()}/día\n`);
    });
    
    // Estadísticas
    const stats = await query(`
      SELECT 
        MIN(precio_dia) as min,
        MAX(precio_dia) as max,
        AVG(precio_dia) as avg,
        COUNT(*) as total
      FROM Peliculas
      WHERE precio_dia IS NOT NULL
    `);
    
    if (stats.rows[0]) {
      const s = stats.rows[0];
      console.log('📊 Estadísticas generales:');
      console.log(`   - Precio mínimo: $${parseFloat(s.min).toLocaleString()}`);
      console.log(`   - Precio máximo: $${parseFloat(s.max).toLocaleString()}`);
      console.log(`   - Precio promedio: $${parseFloat(s.avg).toFixed(0)}`);
      console.log(`   - Total de títulos: ${s.total}`);
    }
    
    await closePostgresPool();
    console.log('\n✅ Listo!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await closePostgresPool();
    process.exit(1);
  }
}

showPrices();




