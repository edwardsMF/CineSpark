# 🐘 Configuración de PostgreSQL

Esta guía te ayudará a configurar la conexión con PostgreSQL para BM2Pelis.

## 📋 Prerrequisitos

1. **PostgreSQL instalado** en tu sistema
   - Windows: Descarga desde [postgresql.org](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)
   - macOS: `brew install postgresql`

2. **Base de datos creada** (ya mencionaste que la creaste)

## 🔧 Pasos de Configuración

### 1. Instalar dependencias

```bash
cd BM2Pelis/server
npm install
```

Esto instalará el paquete `pg` (cliente de PostgreSQL para Node.js).

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `server/` basándote en `ENV.EXAMPLE.txt`:

```env
PORT=4000
JWT_SECRET=ClaveUltraSeguraCineSpark2024

# PostgreSQL Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña_aqui
POSTGRES_DATABASE=nombre_de_tu_base_de_datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# The Movie Database (TMDb) API
TMDB_API_KEY=tu_api_key_aqui
```

**Importante:** Reemplaza:
- `POSTGRES_USER`: Tu usuario de PostgreSQL (por defecto `postgres`)
- `POSTGRES_PASSWORD`: Tu contraseña de PostgreSQL
- `POSTGRES_DATABASE`: El nombre de la base de datos que creaste

### 3. Crear las tablas

Ejecuta el script SQL para crear las tablas. Tienes dos opciones:

#### Opción A: Desde la línea de comandos (psql)

```bash
# Conectarte a PostgreSQL
psql -U postgres -d nombre_de_tu_base_de_datos

# Ejecutar el script
\i server/models/schema_postgres.sql
```

O directamente:

```bash
psql -U postgres -d nombre_de_tu_base_de_datos -f server/models/schema_postgres.sql
```

#### Opción B: Desde pgAdmin o DBeaver

1. Abre pgAdmin o DBeaver
2. Conéctate a tu base de datos
3. Abre el archivo `server/models/schema_postgres.sql`
4. Ejecuta el script completo

### 4. Verificar la conexión

Inicia el servidor:

```bash
cd BM2Pelis/server
npm run dev
```

Deberías ver en la consola:
```
✅ Conexión a PostgreSQL establecida correctamente
✅ Base de datos PostgreSQL conectada
CineSpark API listening on port 4000
```

Si ves un error, verifica:
- ✅ Que PostgreSQL esté corriendo
- ✅ Que las credenciales en `.env` sean correctas
- ✅ Que la base de datos exista
- ✅ Que el usuario tenga permisos sobre la base de datos

## 🗄️ Estructura de la Base de Datos

El esquema incluye las siguientes tablas:

- **Usuarios**: Usuarios del sistema
- **Peliculas**: Catálogo de películas, series y juegos
- **Alquileres**: Registro de alquileres
- **Suscripciones**: Suscripciones de usuarios
- **Pagos**: Registro de pagos
- **Facturas**: Facturas generadas
- **Tickets**: Tickets de soporte
- **Mensajes**: Mensajes de los tickets

## 🔍 Comandos Útiles

### Verificar conexión desde terminal

```bash
psql -U postgres -d nombre_de_tu_base_de_datos -c "SELECT version();"
```

### Ver todas las tablas

```bash
psql -U postgres -d nombre_de_tu_base_de_datos -c "\dt"
```

### Ver estructura de una tabla

```bash
psql -U postgres -d nombre_de_tu_base_de_datos -c "\d Usuarios"
```

## ⚠️ Solución de Problemas

### Error: "password authentication failed"
- Verifica que la contraseña en `.env` sea correcta
- Si olvidaste la contraseña, puedes cambiarla:
  ```bash
  # En Windows (como administrador)
  psql -U postgres
  ALTER USER postgres WITH PASSWORD 'nueva_contraseña';
  ```

### Error: "database does not exist"
- Crea la base de datos:
  ```bash
  psql -U postgres
  CREATE DATABASE nombre_de_tu_base_de_datos;
  \q
  ```

### Error: "connection refused"
- Verifica que PostgreSQL esté corriendo:
  - Windows: Servicios → PostgreSQL
  - Linux: `sudo systemctl status postgresql`
  - macOS: `brew services list`

### Error: "permission denied"
- Asegúrate de que el usuario tenga permisos:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE nombre_de_tu_base_de_datos TO postgres;
  ```

## 📝 Notas

- El pool de conexiones se inicializa automáticamente al iniciar el servidor
- Las conexiones se cierran correctamente al detener el servidor
- El sistema usa un pool de conexiones para mejor rendimiento

## ✅ Listo!

Una vez completados estos pasos, tu aplicación estará conectada a PostgreSQL y lista para usar.




