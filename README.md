# CineSpark 🎬

Plataforma completa tipo Netflix para alquiler de películas y series con sistema de pagos, suscripciones y soporte al cliente.

## ✨ Características

### 🎯 Funcionalidades Principales
- **Autenticación completa** con JWT y roles (usuario/admin)
- **Catálogo de contenido** con filtros avanzados
- **Sistema de alquileres** con pagos integrados
- **Panel de administración** con CRUD completo
- **Sistema de tickets** de soporte al cliente
- **Gestión de suscripciones** y facturación
- **Interfaz moderna** con Tailwind CSS

### 🔒 Seguridad
- Rate limiting para prevenir ataques
- Helmet para headers de seguridad
- Validación de entrada con Joi
- Autenticación JWT con bcrypt
- CORS configurado correctamente

## 🛠️ Tecnologías

### Frontend
- **React 19** con Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Context API** para estado global

### Backend
- **Node.js** con Express
- **PostgreSQL** con pg
- **JWT** para autenticación
- **Joi** para validación
- **Helmet** y **Rate Limiting** para seguridad

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js LTS (v18+)
- PostgreSQL (12+)

### 1. Configuración de la Base de Datos
```sql
-- Conectarse a PostgreSQL y ejecutar:
-- server/models/schema_postgres.sql
```

### 2. Configuración del Backend
```bash
cd server
npm install
cp ENV.EXAMPLE.txt .env
# Editar .env con tus credenciales de PostgreSQL
npm run dev
```

### 3. Configuración del Frontend
```bash
cd client
npm install
npm run dev
```

## 📁 Estructura del Proyecto

```
CineSpark/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── context/       # Context API (Auth)
│   │   ├── services/      # API calls
│   │   └── data/         # Datos mock (desarrollo)
│   ├── tailwind.config.js
│   └── package.json
├── server/                # Backend Node.js
│   ├── config/           # Configuración PostgreSQL
│   ├── controllers/      # Lógica de negocio
│   ├── middleware/       # Middlewares (auth, error)
│   ├── models/          # Esquemas SQL
│   ├── routes/          # Rutas API
│   ├── services/        # Servicios (gateway)
│   ├── app.js           # Configuración Express
│   └── server.js        # Punto de entrada
└── README.md
```

## 🔧 Variables de Entorno

Crea un archivo `.env` en la carpeta `server/`:

```env
# Servidor
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=ClaveUltraSeguraCineSpark2024

# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña
POSTGRES_DATABASE=CineSpark
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Películas
- `GET /api/movies` - Listar películas (con filtros)
- `GET /api/movies/:id` - Obtener película por ID
- `POST /api/movies` - Crear película (admin)
- `PUT /api/movies/:id` - Actualizar película (admin)
- `DELETE /api/movies/:id` - Eliminar película (admin)

### Alquileres
- `GET /api/rentals` - Listar alquileres del usuario
- `POST /api/rentals` - Crear alquiler

### Pagos
- `POST /api/pagos/alquiler` - Pago de alquiler
- `POST /api/pagos/suscripcion` - Pago de suscripción
- `GET /api/pagos/:userId` - Historial de pagos

### Tickets de Soporte
- `POST /api/tickets/crear` - Crear ticket
- `GET /api/tickets/usuario/:id` - Tickets del usuario
- `GET /api/tickets/:id` - Detalle de ticket
- `POST /api/tickets/:id/mensaje` - Agregar mensaje
- `GET /api/tickets/admin/all` - Todos los tickets (admin)

## 🎨 Características de la UI

### Diseño Responsive
- Mobile-first design
- Grid system con Tailwind
- Componentes reutilizables

### Experiencia de Usuario
- Loading states
- Error handling
- Formularios validados
- Navegación intuitiva

### Panel de Administración
- Dashboard con estadísticas
- CRUD completo de películas
- Gestión de tickets
- Tablas con paginación

## 🔐 Seguridad Implementada

- **Rate Limiting**: 100 req/15min general, 5 req/15min auth
- **Helmet**: Headers de seguridad
- **CORS**: Configurado para dominios específicos
- **JWT**: Tokens seguros con expiración
- **Validación**: Joi para todos los inputs
- **Sanitización**: Limpieza de datos de entrada

## 🚀 Despliegue

### Frontend (Vercel/Netlify)
```bash
npm run build
# Subir carpeta dist/
```

### Backend (Render/Railway)
```bash
# Variables de entorno en el panel
# Conectar con PostgreSQL
```

### Base de Datos
- PostgreSQL Cloud (recomendado para producción)
- PostgreSQL local (desarrollo)

## 🧪 Testing

```bash
# Backend
cd server
npm test

# Frontend
cd client
npm test
```

## 📝 Scripts Disponibles

### Backend
```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
```

### Frontend
```bash
npm run dev      # Desarrollo
npm run build     # Build para producción
npm run preview   # Preview del build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [tu-github](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- PostgreSQL por la base de datos
- React y Tailwind por las herramientas
- La comunidad de desarrolladores
