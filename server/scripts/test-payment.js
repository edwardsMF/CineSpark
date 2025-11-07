/**
 * Script para probar la creación de pagos
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

async function testPayment() {
  try {
    console.log('🧪 Probando creación de pago...\n');
    
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
    const monto = 15000;
    const metodo = 'tarjeta';
    const tipo = 'Alquiler';
    const detalle = `Pago alquiler película: ${movies.rows[0].titulo}`;
    
    console.log('📝 Datos del pago:');
    console.log('   Usuario:', users.rows[0].nombre, `(ID: ${userId})`);
    console.log('   Película:', movies.rows[0].titulo, `(ID: ${movieId})`);
    console.log('   Monto:', monto);
    console.log('   Método:', metodo);
    console.log('   Tipo:', tipo);
    console.log('   Detalle:', detalle, '\n');
    
    // Crear pago
    const pagoResult = await query(
      'INSERT INTO Pagos (id_usuario, tipo, monto, metodo, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, tipo, monto, metodo, 'Completado']
    );
    
    console.log('✅ Pago creado exitosamente:');
    console.log(JSON.stringify(pagoResult.rows[0], null, 2));
    
    // Crear factura
    const facturaResult = await query(
      'INSERT INTO Facturas (id_pago, id_usuario, detalle, total) VALUES ($1, $2, $3, $4) RETURNING *',
      [pagoResult.rows[0].id_pago, userId, detalle, monto]
    );
    
    console.log('\n✅ Factura creada exitosamente:');
    console.log(JSON.stringify(facturaResult.rows[0], null, 2));
    
    // Verificar que se guardó
    const verify = await query(
      `SELECT p.*, f.detalle, f.total as factura_total, u.nombre as usuario_nombre 
       FROM Pagos p 
       JOIN Facturas f ON p.id_pago = f.id_pago 
       JOIN Usuarios u ON p.id_usuario = u.id_usuario 
       WHERE p.id_pago = $1`,
      [pagoResult.rows[0].id_pago]
    );
    
    console.log('\n✅ Verificación en base de datos:');
    console.log(JSON.stringify(verify.rows[0], null, 2));
    
    // Listar últimos pagos
    const allPayments = await query(
      `SELECT p.*, u.nombre as usuario_nombre 
       FROM Pagos p 
       JOIN Usuarios u ON p.id_usuario = u.id_usuario 
       ORDER BY p.fecha_pago DESC 
       LIMIT 5`
    );
    
    console.log('\n📋 Últimos 5 pagos:');
    allPayments.rows.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.usuario_nombre} - ${payment.tipo} - $${payment.monto} - ${new Date(payment.fecha_pago).toLocaleDateString()}`);
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

testPayment();


