/**
 * Script de diagnóstico completo para PostgreSQL
 * Muestra información detallada sobre la conexión y posibles problemas
 * Uso: node scripts/diagnostico-postgres.js
 */
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

async function diagnostico() {
  console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A POSTGRESQL\n');
  console.log('='.repeat(50));
  
  // 1. Verificar variables de entorno
  console.log('\n📋 PASO 1: Verificando variables de entorno...');
  const vars = {
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost (por defecto)',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '5432 (por defecto)',
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || '❌ NO CONFIGURADO',
    POSTGRES_USER: process.env.POSTGRES_USER || '❌ NO CONFIGURADO',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '✅ Configurado' : '❌ NO CONFIGURADO',
  };
  
  console.table(vars);
  
  if (!process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_DATABASE) {
    console.error('\n❌ ERROR: Faltan variables de entorno requeridas');
    console.error('   Verifica tu archivo .env en server/.env');
    console.error('   Variables requeridas:');
    console.error('   - POSTGRES_USER');
    console.error('   - POSTGRES_PASSWORD');
    console.error('   - POSTGRES_DATABASE');
    process.exit(1);
  }
  
  // 2. Verificar si PostgreSQL está corriendo (intentar conexión básica)
  console.log('\n📋 PASO 2: Verificando si PostgreSQL está corriendo...');
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5432');
  
  console.log(`   Intentando conectar a ${host}:${port}...`);
  
  const config = {
    user: process.env.POSTGRES_USER,
    host: host,
    database: 'postgres', // Intentar conectar a la BD por defecto primero
    password: process.env.POSTGRES_PASSWORD,
    port: port,
    connectionTimeoutMillis: 5000,
  };
  
  let pool;
  try {
    pool = new Pool(config);
    const client = await pool.connect();
    console.log('✅ PostgreSQL está corriendo y acepta conexiones');
    const versionResult = await client.query('SELECT version()');
    console.log(`   Versión: ${versionResult.rows[0].version.split(',')[0]}`);
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL');
    console.error(`   Error: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUCIÓN: PostgreSQL no está corriendo o no está escuchando en ese puerto');
      console.error('   En Windows:');
      console.error('   1. Abre "Servicios" (services.msc)');
      console.error('   2. Busca "postgresql-x64-XX" o "PostgreSQL"');
      console.error('   3. Verifica que esté "En ejecución"');
      console.error('   4. Si no está corriendo, haz clic derecho > Iniciar');
      console.error('\n   O verifica el puerto:');
      console.error(`   netstat -an | findstr ${port}`);
    } else if (error.code === '28P01') {
      console.error('\n💡 SOLUCIÓN: Usuario o contraseña incorrectos');
      console.error('   Verifica POSTGRES_USER y POSTGRES_PASSWORD en tu .env');
    }
    process.exit(1);
  }
  
  // 3. Verificar que la base de datos existe
  console.log('\n📋 PASO 3: Verificando que la base de datos existe...');
  const dbName = process.env.POSTGRES_DATABASE;
  
  try {
    const dbConfig = {
      ...config,
      database: dbName,
    };
    const dbPool = new Pool(dbConfig);
    const dbClient = await dbPool.connect();
    console.log(`✅ Base de datos "${dbName}" existe y es accesible`);
    
    // Verificar tablas
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Tablas encontradas: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('   Tablas:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  No hay tablas en la base de datos');
      console.log('   Ejecuta: server/models/schema_postgres.sql');
    }
    
    // Verificar permisos
    const permResult = await dbClient.query(`
      SELECT has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
             has_database_privilege(current_user, current_database(), 'CREATE') as can_create
    `);
    
    console.log('\n🔐 Permisos:');
    console.log(`   Conectar: ${permResult.rows[0].can_connect ? '✅' : '❌'}`);
    console.log(`   Crear: ${permResult.rows[0].can_create ? '✅' : '❌'}`);
    
    dbClient.release();
    await dbPool.end();
    
  } catch (error) {
    console.error(`❌ Error accediendo a la base de datos "${dbName}"`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    
    if (error.code === '3D000') {
      console.error('\n💡 SOLUCIÓN: La base de datos no existe');
      console.error(`   Crea la base de datos con:`);
      console.error(`   CREATE DATABASE "${dbName}";`);
      console.error('\n   O desde pgAdmin:');
      console.error('   1. Click derecho en "Databases"');
      console.error('   2. Create > Database');
      console.error(`   3. Nombre: ${dbName}`);
    } else if (error.code === '28P01') {
      console.error('\n💡 SOLUCIÓN: Usuario o contraseña incorrectos');
    }
    process.exit(1);
  }
  
  // 4. Probar conexión usando el módulo del proyecto
  console.log('\n📋 PASO 4: Probando conexión con el módulo del proyecto...');
  try {
    const { initPostgresPool, query, closePostgresPool } = await import('../config/postgres.js');
    await initPostgresPool();
    const result = await query('SELECT current_database(), current_user, version()');
    console.log('✅ Conexión exitosa usando el módulo del proyecto');
    console.log(`   Base de datos: ${result.rows[0].current_database}`);
    console.log(`   Usuario: ${result.rows[0].current_user}`);
    await closePostgresPool();
  } catch (error) {
    console.error('❌ Error en el módulo del proyecto');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ DIAGNÓSTICO COMPLETADO - Todo está funcionando correctamente');
  console.log('='.repeat(50));
  process.exit(0);
}

diagnostico().catch(error => {
  console.error('\n❌ Error inesperado:', error);
  process.exit(1);
});



