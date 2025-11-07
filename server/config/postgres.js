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
    connectionTimeoutMillis: 2000,
  };

  if (!config.user || !config.password || !config.database) {
    throw new Error('Missing PostgreSQL env vars: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE');
  }

  pool = new Pool(config);

  // Manejo de errores del pool
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
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
  if (!pool) await initPostgresPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Solo loggear queries lentas o importantes
    if (duration > 100 || process.env.DEBUG_QUERIES === 'true') {
      console.log('Query ejecutada', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Error ejecutando query:', { 
      text: text.substring(0, 200), 
      params: params ? params.map(p => typeof p === 'string' ? p.substring(0, 50) : p) : null,
      error: error.message 
    });
    throw error;
  }
}

