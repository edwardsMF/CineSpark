# 🚀 Inicio Rápido - CineSpark

## Scripts de Inicio Automático

### Para Linux/Mac/Git Bash (Windows):
```bash
./start.sh
```

### Para Windows (CMD):
```cmd
start.bat
```

## ¿Qué hace el script?

1. ✅ **Verifica dependencias** (Node.js, npm)
2. ✅ **Instala dependencias** automáticamente si no existen
3. ✅ **Inicia el Backend** (puerto 4000)
   - El catálogo se carga automáticamente desde TMDb
   - El script `initCatalog.js` se ejecuta automáticamente
4. ✅ **Inicia el Frontend** (puerto 5173)
5. ✅ **Muestra los logs** en tiempo real

## URLs de Acceso

- **Backend API**: http://localhost:4000
- **Frontend**: http://localhost:5173

## Detener los Servidores

### En Linux/Mac/Git Bash:
Presiona `Ctrl+C` en la terminal donde se ejecutó el script.

### En Windows:
Cierra las ventanas de CMD que se abrieron para cada servidor.

## Características del Script

- ✅ Instala dependencias automáticamente
- ✅ Crea el archivo `.env` si no existe
- ✅ Espera a que el backend esté listo antes de iniciar el frontend
- ✅ Muestra logs en tiempo real
- ✅ Limpia procesos al cerrar (Linux/Mac)

## Notas Importantes

1. **Primera vez**: El script instalará todas las dependencias (puede tardar unos minutos)

2. **API Key de TMDb**: Si no tienes configurada la API key, el script creará un `.env` básico. Debes agregar tu `TMDB_API_KEY` en `server/.env`

3. **Carga del catálogo**: El catálogo se carga automáticamente al iniciar el backend (si está vacío y tienes la API key configurada)

4. **Puertos**: Asegúrate de que los puertos 4000 y 5173 estén libres

## Solución de Problemas

### El backend no inicia
- Verifica que el puerto 4000 esté libre
- Revisa el archivo `server/.env`
- Mira los logs: `tail -f backend.log`

### El frontend no inicia
- Verifica que el puerto 5173 esté libre
- Revisa los logs: `tail -f frontend.log`

### Dependencias faltantes
- El script las instala automáticamente
- Si hay problemas, ejecuta manualmente:
  ```bash
  cd server && npm install
  cd ../client && npm install
  ```

## Inicio Manual (Alternativa)

Si prefieres iniciar manualmente:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```
