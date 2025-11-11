import pkg from 'pg';
const { Pool } = pkg;

let pool;

/**
 * Inicializa el pool de conexiones a PostgreSQL
 */
export async function initPostgresPool() {
  if (pool) return pool;

  const config = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT || 5432,
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Aumentado a 10 segundos
    statement_timeout: 30000, // Timeout para queries (30 segundos)
  };

  if (!config.user || !config.password || !config.database) {
    throw new Error('Missing PostgreSQL env vars: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE');
  }

  pool = new Pool(config);

  // Manejo de errores del pool
  pool.on('error', (err, client) => {
    console.error('⚠️  Error en cliente inactivo del pool:', err.message);
    // No cerrar el proceso, solo loggear el error
    // El pool se encargará de recrear la conexión si es necesario
  });

  // Probar la conexión
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
  } catch (err) {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    throw err;
  }

  return pool;
}

/**
 * Cierra el pool de conexiones
 */
export async function closePostgresPool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
  console.log('✅ Pool de PostgreSQL cerrado');
}

/**
 * Obtiene una conexión del pool
 */
export async function getConnection() {
  if (!pool) await initPostgresPool();
  return pool.connect();
}

/**
 * Ejecuta una query y retorna el resultado
 */
export async function query(text, params) {
  // Asegurar que el pool esté inicializado
  if (!pool) {
    try {
      await initPostgresPool();
    } catch (err) {
      console.error('❌ Error al inicializar pool:', err.message);
      throw err;
    }
  }
  
  const start = Date.now();
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      // Solo loggear queries lentas o importantes
      if (duration > 100 || process.env.DEBUG_QUERIES === 'true') {
        console.log('Query ejecutada', { text: text.substring(0, 100), duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      // Si es un error de conexión y tenemos reintentos, intentar reconectar
      if (retries < maxRetries && (
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Connection terminated') ||
        error.message.includes('Connection ended')
      )) {
        retries++;
        console.warn(`⚠️  Error de conexión (intento ${retries}/${maxRetries}), reintentando...`);
        // Resetear el pool para forzar reconexión
        if (pool) {
          try {
            await pool.end();
          } catch (e) {
            // Ignorar errores al cerrar
          }
          pool = undefined;
        }
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Reintentar inicializar el pool
        try {
          await initPostgresPool();
        } catch (err) {
          if (retries >= maxRetries) {
            throw err;
          }
          continue;
        }
        continue;
      }
      
      // Si no es un error de conexión o ya agotamos los reintentos, lanzar el error
      console.error('❌ Error ejecutando query:', { 
        text: text.substring(0, 200), 
        params: params ? params.map(p => typeof p === 'string' ? p.substring(0, 50) : p) : null,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }
}

