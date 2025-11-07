/**
 * Script para probar la conexión a PostgreSQL
 * Uso: node scripts/test-postgres-connection.js
 */
import 'dotenv/config';
import { initPostgresPool, query, closePostgresPool } from '../config/postgres.js';

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a PostgreSQL...\n');
    
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log(`   POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`   POSTGRES_PORT: ${process.env.POSTGRES_PORT || 5432}`);
    console.log(`   POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE || 'NO CONFIGURADO'}`);
    console.log(`   POSTGRES_USER: ${process.env.POSTGRES_USER || 'NO CONFIGURADO'}`);
    console.log(`   POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***' : 'NO CONFIGURADO'}\n`);

    if (!process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_DATABASE) {
      console.error('❌ Error: Faltan variables de entorno requeridas');
      console.error('   Asegúrate de tener un archivo .env con:');
      console.error('   - POSTGRES_USER');
      console.error('   - POSTGRES_PASSWORD');
      console.error('   - POSTGRES_DATABASE');
      process.exit(1);
    }

    // Inicializar pool
    await initPostgresPool();
    console.log('✅ Pool de conexiones inicializado\n');

    // Probar query simple
    console.log('🔍 Ejecutando query de prueba...');
    const result = await query('SELECT version() as version, current_database() as database, current_user as user');
    console.log('✅ Query ejecutada exitosamente\n');
    console.log('📊 Información de la conexión:');
    console.log(`   Base de datos: ${result.rows[0].database}`);
    console.log(`   Usuario: ${result.rows[0].user}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);

    // Verificar tablas
    console.log('🔍 Verificando tablas...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No se encontraron tablas en la base de datos');
      console.log('   Ejecuta el script: server/models/schema_postgres.sql\n');
    } else {
      console.log(`✅ Se encontraron ${tablesResult.rows.length} tablas:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Cerrar conexión
    await closePostgresPool();
    console.log('✅ Prueba completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error al conectar a PostgreSQL:');
    console.error(`   ${error.message}\n`);
    
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


