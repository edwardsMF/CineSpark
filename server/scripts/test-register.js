/**
 * Script para probar el registro de usuarios
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';

async function testRegister() {
  try {
    console.log('🧪 Probando registro de usuario...\n');
    
    const testUser = {
      nombre: 'Usuario Prueba',
      correo: `test${Date.now()}@test.com`,
      contrasena: 'test123456'
    };
    
    console.log('📝 Datos del usuario de prueba:');
    console.log('   Nombre:', testUser.nombre);
    console.log('   Correo:', testUser.correo);
    console.log('   Contraseña:', '***\n');
    
    // Verificar si el correo ya existe
    const existing = await query(
      'SELECT id_usuario FROM Usuarios WHERE correo = $1',
      [testUser.correo]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  El correo ya existe');
      return;
    }
    
    // Hashear contraseña
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(testUser.contrasena, 10);
    console.log('🔐 Contraseña hasheada correctamente\n');
    
    // Insertar usuario
    const result = await query(
      'INSERT INTO Usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre, correo, rol',
      [testUser.nombre, testUser.correo, hashedPassword, 'user']
    );
    
    console.log('✅ Usuario registrado exitosamente:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // Verificar que se guardó
    const verify = await query(
      'SELECT id_usuario, nombre, correo, rol FROM Usuarios WHERE correo = $1',
      [testUser.correo]
    );
    
    console.log('\n✅ Verificación en base de datos:');
    console.log(JSON.stringify(verify.rows[0], null, 2));
    
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

testRegister();




