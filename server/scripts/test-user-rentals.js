/**
 * Script para probar que los alquileres se filtran por usuario
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

async function testUserRentals() {
  try {
    console.log('🧪 Probando filtrado de alquileres por usuario...\n');
    
    // Obtener todos los usuarios
    const users = await query('SELECT id_usuario, nombre, correo FROM Usuarios');
    console.log('👥 Usuarios en la base de datos:');
    users.rows.forEach(user => {
      console.log(`   - ${user.nombre} (ID: ${user.id_usuario}, Email: ${user.correo})`);
    });
    console.log('');
    
    // Obtener todos los alquileres
    const allRentals = await query(`
      SELECT a.*, u.nombre as usuario_nombre, p.titulo as pelicula_titulo
      FROM Alquileres a
      JOIN Usuarios u ON a.id_usuario = u.id_usuario
      JOIN Peliculas p ON a.id_pelicula = p.id_pelicula
      ORDER BY a.fecha_alquiler DESC
    `);
    
    console.log('📋 Todos los alquileres en la base de datos:');
    if (allRentals.rows.length === 0) {
      console.log('   No hay alquileres registrados\n');
    } else {
      allRentals.rows.forEach((rental, index) => {
        console.log(`   ${index + 1}. Usuario: ${rental.usuario_nombre} (ID: ${rental.id_usuario})`);
        console.log(`      Película: ${rental.pelicula_titulo} (ID: ${rental.id_pelicula})`);
        console.log(`      Fecha: ${new Date(rental.fecha_alquiler).toLocaleDateString()}`);
        console.log(`      Estado: ${rental.estado}\n`);
      });
    }
    
    // Probar filtrado por usuario
    if (users.rows.length > 0) {
      const testUserId = users.rows[0].id_usuario;
      console.log(`🔍 Probando filtrado para usuario ID: ${testUserId}`);
      
      const userRentals = await query(`
        SELECT a.*, p.titulo, p.genero, p.tipo, p.imagen, p.anio
        FROM Alquileres a
        JOIN Peliculas p ON a.id_pelicula = p.id_pelicula
        WHERE a.id_usuario = $1
        ORDER BY a.fecha_alquiler DESC
      `, [testUserId]);
      
      console.log(`✅ Alquileres para usuario ${testUserId}: ${userRentals.rows.length}`);
      if (userRentals.rows.length > 0) {
        userRentals.rows.forEach((rental, index) => {
          console.log(`   ${index + 1}. ${rental.titulo} - ${new Date(rental.fecha_alquiler).toLocaleDateString()}`);
        });
      } else {
        console.log('   Este usuario no tiene alquileres');
      }
    }
    
    await closePostgresPool();
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (err) {
    console.error('\n❌ Error en la prueba:', err);
    console.error('   Mensaje:', err.message);
    await closePostgresPool();
    process.exit(1);
  }
}

testUserRentals();




