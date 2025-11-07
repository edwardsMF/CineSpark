import app from './app.js';
import { initPostgresPool, closePostgresPool } from './config/postgres.js';
import { initializeCatalog } from './scripts/initCatalog.js';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Inicializar conexión a PostgreSQL
    await initPostgresPool();
    console.log('✅ Base de datos PostgreSQL conectada');
    
    // Inicializar catálogo desde TMDb (si está configurado)
    await initializeCatalog();
    
    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`CineSpark API listening on port ${PORT}`);
      console.log(`📱 Frontend disponible en: http://localhost:3000`);
      console.log(`🔧 Backend API disponible en: http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      // eslint-disable-next-line no-console
      console.log('Shutting down...');
      server.close(async () => {
        await closePostgresPool();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

