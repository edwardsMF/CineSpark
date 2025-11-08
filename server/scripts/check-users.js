/**
 * Script para verificar usuarios y sus contraseñas
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    // Obtener todos los usuarios
    const result = await query(
      'SELECT id_usuario, nombre, correo, contrasena, rol FROM Usuarios'
    );
    
    if (result.rows.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos\n');
      await closePostgresPool();
      return;
    }
    
    console.log(`📊 Se encontraron ${result.rows.length} usuarios:\n`);
    
    for (const usuario of result.rows) {
      console.log(`Usuario: ${usuario.nombre}`);
      console.log(`  Correo: ${usuario.correo}`);
      console.log(`  Rol: ${usuario.rol}`);
      console.log(`  ID: ${usuario.id_usuario}`);
      
      // Verificar formato de contraseña
      const password = usuario.contrasena;
      const isHashed = password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
      
      if (isHashed) {
        console.log(`  ✅ Contraseña está hasheada (bcrypt)`);
        console.log(`  Preview: ${password.substring(0, 30)}...`);
      } else {
        console.log(`  ⚠️  Contraseña NO está hasheada (texto plano)`);
        console.log(`  Valor: ${password.substring(0, 20)}...`);
      }
      console.log('');
    }
    
    // Probar login con el primer usuario
    if (result.rows.length > 0) {
      const testUser = result.rows[0];
      console.log(`\n🧪 Probando login con: ${testUser.correo}`);
      
      // Intentar con una contraseña común
      const testPasswords = ['123456', 'password', 'admin123', 'test123'];
      
      for (const testPwd of testPasswords) {
        try {
          const match = await bcrypt.compare(testPwd, testUser.contrasena);
          if (match) {
            console.log(`  ✅ Contraseña encontrada: "${testPwd}"`);
            break;
          }
        } catch (err) {
          // Si falla bcrypt.compare, la contraseña no está hasheada
          if (testPwd === testUser.contrasena) {
            console.log(`  ⚠️  Contraseña en texto plano: "${testPwd}"`);
            break;
          }
        }
      }
    }
    
    await closePostgresPool();
    console.log('\n✅ Verificación completada');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await closePostgresPool();
    process.exit(1);
  }
}

checkUsers();


