/**
 * Script para actualizar descripciones faltantes en películas y series
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

/**
 * Genera una descripción por defecto basada en el título, tipo y género
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

async function updateDescriptions() {
  try {
    console.log('📝 Actualizando descripciones faltantes...\n');

    // Buscar películas/series sin descripción o con descripción vacía
    const sinDescripcion = await query(`
      SELECT id_pelicula, titulo, tipo, genero, anio, descripcion
      FROM Peliculas
      WHERE descripcion IS NULL OR descripcion = '' OR TRIM(descripcion) = ''
    `);
    
    console.log(`📊 Películas/series sin descripción: ${sinDescripcion.rows.length}\n`);

    if (sinDescripcion.rows.length === 0) {
      console.log('✅ Todas las películas y series tienen descripción\n');
      await closePostgresPool();
      return;
    }

    let actualizadas = 0;
    let errores = 0;

    for (const pelicula of sinDescripcion.rows) {
      try {
        const nuevaDescripcion = generarDescripcionPorDefecto(pelicula);
        
        await query(
          'UPDATE Peliculas SET descripcion = $1 WHERE id_pelicula = $2',
          [nuevaDescripcion, pelicula.id_pelicula]
        );

        actualizadas++;
        
        // Mostrar algunas actualizaciones como ejemplo
        if (actualizadas <= 10 || actualizadas % 50 === 0) {
          console.log(`   ${actualizadas}. ${pelicula.titulo.substring(0, 40)} (${pelicula.tipo})`);
          console.log(`      Descripción: ${nuevaDescripcion.substring(0, 80)}...\n`);
        }
      } catch (err) {
        errores++;
        console.error(`   ❌ Error actualizando ${pelicula.titulo}:`, err.message);
      }
    }

    console.log(`\n✅ Actualización completada:`);
    console.log(`   - Descripciones agregadas: ${actualizadas}`);
    console.log(`   - Errores: ${errores}`);

    // Verificar resultado
    const verificacion = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(descripcion) as con_descripcion,
        COUNT(*) - COUNT(descripcion) as sin_descripcion
      FROM Peliculas
    `);

    if (verificacion.rows[0]) {
      const v = verificacion.rows[0];
      console.log(`\n📊 Verificación final:`);
      console.log(`   - Total: ${v.total}`);
      console.log(`   - Con descripción: ${v.con_descripcion}`);
      console.log(`   - Sin descripción: ${v.sin_descripcion}`);
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

updateDescriptions();




