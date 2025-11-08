/**
 * Script para corregir contraseñas en texto plano
 */
import 'dotenv/config';
import { query, closePostgresPool } from '../config/postgres.js';
import bcrypt from 'bcryptjs';

async function fixPasswords() {
  try {
    console.log('🔧 Corrigiendo contraseñas en texto plano...\n');
    
    // Obtener todos los usuarios
    const result = await query(
      'SELECT id_usuario, nombre, correo, contrasena, rol FROM Usuarios'
    );
    
    let fixed = 0;
    
    for (const usuario of result.rows) {
      const password = usuario.contrasena;
      const isHashed = password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
      
      if (!isHashed) {
        console.log(`⚠️  Usuario "${usuario.nombre}" (${usuario.correo}) tiene contraseña en texto plano`);
        console.log(`   Contraseña actual: "${password}"`);
        
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Actualizar en la base de datos
        await query(
          'UPDATE Usuarios SET contrasena = $1 WHERE id_usuario = $2',
          [hashedPassword, usuario.id_usuario]
        );
        
        console.log(`   ✅ Contraseña hasheada y actualizada`);
        console.log(`   📝 La contraseña sigue siendo: "${password}" (pero ahora está hasheada)\n`);
        fixed++;
      }
    }
    
    if (fixed === 0) {
      console.log('✅ Todas las contraseñas ya están hasheadas correctamente\n');
    } else {
      console.log(`✅ Se corrigieron ${fixed} contraseña(s)\n`);
    }
    
    await closePostgresPool();
    console.log('✅ Proceso completado');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await closePostgresPool();
    process.exit(1);
  }
}

fixPasswords();


