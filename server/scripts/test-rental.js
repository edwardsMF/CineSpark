/**
 * Script para probar la creación de alquileres
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

async function testRental() {
  try {
    console.log('🧪 Probando creación de alquiler...\n');
    
    // Obtener un usuario y una película existentes
    const users = await query('SELECT id_usuario, nombre FROM Usuarios LIMIT 1');
    const movies = await query('SELECT id_pelicula, titulo FROM Peliculas LIMIT 1');
    
    if (users.rows.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      await closePostgresPool();
      process.exit(1);
    }
    
    if (movies.rows.length === 0) {
      console.error('❌ No hay películas en la base de datos');
      await closePostgresPool();
      process.exit(1);
    }
    
    const userId = users.rows[0].id_usuario;
    const movieId = movies.rows[0].id_pelicula;
    
    console.log('📝 Datos del alquiler:');
    console.log('   Usuario:', users.rows[0].nombre, `(ID: ${userId})`);
    console.log('   Película:', movies.rows[0].titulo, `(ID: ${movieId})`);
    console.log('   Estado: Activo\n');
    
    // Crear alquiler
    const result = await query(
      'INSERT INTO Alquileres (id_usuario, id_pelicula, estado) VALUES ($1, $2, $3) RETURNING *',
      [userId, movieId, 'Activo']
    );
    
    console.log('✅ Alquiler creado exitosamente:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // Verificar que se guardó
    const verify = await query(
      'SELECT a.*, u.nombre as usuario_nombre, p.titulo as pelicula_titulo FROM Alquileres a JOIN Usuarios u ON a.id_usuario = u.id_usuario JOIN Peliculas p ON a.id_pelicula = p.id_pelicula WHERE a.id_alquiler = $1',
      [result.rows[0].id_alquiler]
    );
    
    console.log('\n✅ Verificación en base de datos:');
    console.log(JSON.stringify(verify.rows[0], null, 2));
    
    // Listar todos los alquileres
    const allRentals = await query(
      'SELECT a.*, u.nombre as usuario_nombre, p.titulo as pelicula_titulo FROM Alquileres a JOIN Usuarios u ON a.id_usuario = u.id_usuario JOIN Peliculas p ON a.id_pelicula = p.id_pelicula ORDER BY a.fecha_alquiler DESC LIMIT 5'
    );
    
    console.log('\n📋 Últimos 5 alquileres:');
    allRentals.rows.forEach((rental, index) => {
      console.log(`   ${index + 1}. ${rental.usuario_nombre} alquiló "${rental.pelicula_titulo}" el ${new Date(rental.fecha_alquiler).toLocaleDateString()}`);
    });
    
    await closePostgresPool();
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (err) {
    console.error('\n❌ Error en la prueba:', err);
    console.error('   Mensaje:', err.message);
    console.error('   Stack:', err.stack);
    await closePostgresPool();
    process.exit(1);
  }
}

testRental();




