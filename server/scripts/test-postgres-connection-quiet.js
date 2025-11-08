/**
 * Script para probar la conexión a PostgreSQL (versión silenciosa)
 * Uso: node scripts/test-postgres-connection-quiet.js
 */
import 'dotenv/config';
import { initPostgresPool, query, closePostgresPool } from '../config/postgres.js';

async function testConnection() {
  try {
    // Verificar variables de entorno
    if (!process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_DATABASE) {
      console.error('❌ Error: Faltan variables de entorno requeridas');
      process.exit(1);
    }

    // Inicializar pool
    await initPostgresPool();

    // Probar query simple
    await query('SELECT version() as version, current_database() as database, current_user as user');

    // Verificar tablas
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No se encontraron tablas en la base de datos');
      console.log('   Ejecuta el script: server/models/schema_postgres.sql');
    } else {
      console.log(`✅ Se encontraron ${tablesResult.rows.length} tablas en la base de datos`);
    }

    // Cerrar conexión
    await closePostgresPool();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error al conectar a PostgreSQL:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Posibles soluciones:');
      console.error('   1. Verifica que PostgreSQL esté corriendo');
      console.error('   2. Verifica que POSTGRES_HOST y POSTGRES_PORT sean correctos');
    } else if (error.code === '28P01') {
      console.error('💡 Posibles soluciones:');
      console.error('   1. Verifica que POSTGRES_USER y POSTGRES_PASSWORD sean correctos');
    } else if (error.code === '3D000') {
      console.error('💡 Posibles soluciones:');
      console.error('   1. Verifica que la base de datos exista');
      console.error('   2. Crea la base de datos: CREATE DATABASE nombre_de_tu_base_de_datos;');
    }
    
    process.exit(1);
  }
}

testConnection();


