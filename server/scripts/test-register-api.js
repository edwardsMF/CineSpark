/**
 * Script para probar el endpoint de registro vía API
 */
import 'dotenv/config';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

async function testRegisterAPI() {
  try {
    console.log('🧪 Probando endpoint de registro vía API...\n');
    console.log('📍 URL del servidor:', SERVER_URL);
    
    const testUser = {
      nombre: 'Usuario API Test',
      correo: `apitest${Date.now()}@test.com`,
      contrasena: 'test123456'
    };
    
    console.log('📝 Datos del usuario:');
    console.log('   Nombre:', testUser.nombre);
    console.log('   Correo:', testUser.correo);
    console.log('   Contraseña: ***\n');
    
    // Verificar que el servidor esté corriendo
    console.log('🔍 Verificando que el servidor esté corriendo...');
    try {
      const healthCheck = await fetch(`${SERVER_URL}/api/health`);
      if (!healthCheck.ok) {
        throw new Error('Servidor no responde correctamente');
      }
      const health = await healthCheck.json();
      console.log('✅ Servidor está corriendo:', health);
    } catch (err) {
      console.error('❌ El servidor no está corriendo en', SERVER_URL);
      console.error('   Error:', err.message);
      console.log('\n💡 Inicia el servidor con: npm run dev\n');
      process.exit(1);
    }
    
    console.log('\n📤 Enviando petición de registro...');
    const response = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('📊 Respuesta del servidor:');
    console.log('   Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('   Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Registro exitoso vía API!');
      console.log('   ID de usuario:', data.id_usuario);
    } else {
      console.log('\n❌ Error en el registro:');
      console.log('   Mensaje:', data.error);
    }
    
  } catch (err) {
    console.error('\n❌ Error en la prueba:', err);
    console.error('   Mensaje:', err.message);
    process.exit(1);
  }
}

testRegisterAPI();


