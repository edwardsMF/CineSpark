# 🔍 Cómo Verificar la Conexión a PostgreSQL

Si el script `start.sh` no se conecta a PostgreSQL, aquí tienes varias formas de diagnosticar el problema.

## 🚀 Método 1: Script de Diagnóstico Completo (Recomendado)

Ejecuta el script de diagnóstico que muestra información detallada:

```bash
cd server
node scripts/diagnostico-postgres.js
```

Este script te mostrará:
- ✅ Variables de entorno configuradas
- ✅ Si PostgreSQL está corriendo
- ✅ Si la base de datos existe
- ✅ Tablas disponibles
- ✅ Permisos del usuario
- ✅ Prueba de conexión completa

## 🔧 Método 2: Script de Prueba Simple

```bash
cd server
node scripts/test-postgres-connection.js
```

Este script muestra información básica sobre la conexión.

## 📋 Método 3: Verificación Manual

### Paso 1: Verificar que PostgreSQL está corriendo

**En Windows:**
```bash
# Opción 1: Verificar en Servicios
# Presiona Win+R, escribe: services.msc
# Busca "postgresql" o "PostgreSQL" y verifica que esté "En ejecución"

# Opción 2: Verificar con netstat
netstat -an | findstr 5432
```

**En Linux/Mac:**
```bash
# Verificar si PostgreSQL está corriendo
sudo systemctl status postgresql
# o
pg_isready -h localhost -p 5432
```

### Paso 2: Verificar el archivo .env

Asegúrate de que `server/.env` tenga estas variables:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña_aqui
POSTGRES_DATABASE=CineSpark
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Paso 3: Probar conexión desde pgAdmin

1. Abre pgAdmin
2. Conecta al servidor PostgreSQL
3. Verifica que la base de datos "CineSpark" existe
4. Si no existe, créala:
   ```sql
   CREATE DATABASE "CineSpark";
   ```

### Paso 4: Probar conexión desde la línea de comandos

**En Windows (Git Bash):**
```bash
# Si tienes psql instalado
psql -h localhost -p 5432 -U postgres -d CineSpark
```

**En Linux/Mac:**
```bash
psql -h localhost -p 5432 -U postgres -d CineSpark
```

## ❌ Errores Comunes y Soluciones

### Error: `ECONNREFUSED`
**Problema:** PostgreSQL no está corriendo o no está escuchando en ese puerto.

**Solución:**
1. Inicia PostgreSQL desde Servicios (Windows) o `sudo systemctl start postgresql` (Linux)
2. Verifica el puerto: `netstat -an | findstr 5432` (Windows) o `netstat -tuln | grep 5432` (Linux)

### Error: `28P01` - Autenticación fallida
**Problema:** Usuario o contraseña incorrectos.

**Solución:**
1. Verifica `POSTGRES_USER` y `POSTGRES_PASSWORD` en `server/.env`
2. Prueba la contraseña desde pgAdmin
3. Si olvidaste la contraseña, puedes cambiarla:
   ```sql
   ALTER USER postgres WITH PASSWORD 'nueva_contraseña';
   ```

### Error: `3D000` - Base de datos no existe
**Problema:** La base de datos "CineSpark" no existe.

**Solución:**
1. Crea la base de datos desde pgAdmin:
   - Click derecho en "Databases" > Create > Database
   - Nombre: `CineSpark`
2. O desde la línea de comandos:
   ```sql
   CREATE DATABASE "CineSpark";
   ```

### Error: Variables de entorno no encontradas
**Problema:** El archivo `.env` no existe o está mal configurado.

**Solución:**
1. Verifica que existe `server/.env`
2. Si no existe, copia desde el ejemplo:
   ```bash
   cd server
   cp ENV.EXAMPLE.txt .env
   ```
3. Edita `.env` con tus credenciales

## 🧪 Prueba Rápida desde Node.js

Crea un archivo temporal `test.js`:

```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CineSpark',
  password: 'tu_contraseña',
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Conexión exitosa:', res.rows[0]);
  }
  pool.end();
});
```

Ejecuta: `node test.js`

## 📞 Verificar desde el código del proyecto

Si el servidor ya está corriendo, puedes verificar los logs:

```bash
# Ver logs del backend
tail -f backend.log

# O si el servidor está corriendo, busca mensajes como:
# "✅ Base de datos PostgreSQL conectada"
# o errores de conexión
```

## ✅ Checklist de Verificación

- [ ] PostgreSQL está corriendo (verificar en Servicios)
- [ ] El puerto 5432 está abierto y escuchando
- [ ] El archivo `server/.env` existe
- [ ] Las variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` están configuradas
- [ ] La base de datos "CineSpark" existe
- [ ] El usuario tiene permisos para acceder a la base de datos
- [ ] Puedes conectarte desde pgAdmin con las mismas credenciales

## 🆘 Si Nada Funciona

1. **Reinicia PostgreSQL:**
   - Windows: Detén y inicia el servicio desde Services
   - Linux: `sudo systemctl restart postgresql`

2. **Verifica el firewall:**
   - Asegúrate de que el puerto 5432 no esté bloqueado

3. **Revisa los logs de PostgreSQL:**
   - Windows: `C:\Program Files\PostgreSQL\XX\data\log\`
   - Linux: `/var/log/postgresql/`

4. **Prueba con otro cliente:**
   - Intenta conectarte con pgAdmin o DBeaver usando las mismas credenciales

