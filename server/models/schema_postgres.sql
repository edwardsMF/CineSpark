-- BM2Pelis PostgreSQL Schema
-- Ejecutar este script después de crear la base de datos

-- Crear tablas
CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  correo VARCHAR(150) UNIQUE NOT NULL,
  contrasena VARCHAR(200) NOT NULL,
  rol VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS Peliculas (
  id_pelicula SERIAL PRIMARY KEY,
  titulo VARCHAR(150),
  genero VARCHAR(100),
  tipo VARCHAR(50),
  anio INTEGER,
  descripcion TEXT,
  imagen VARCHAR(255),
  precio_dia DECIMAL(10,2) DEFAULT 10000
);

CREATE TABLE IF NOT EXISTS Alquileres (
  id_alquiler SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
  id_pelicula INTEGER REFERENCES Peliculas(id_pelicula) ON DELETE CASCADE,
  fecha_alquiler TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS Suscripciones (
  id_suscripcion SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
  tipo VARCHAR(50),
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Pagos (
  id_pago SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
  tipo VARCHAR(50),
  monto DECIMAL(10,2),
  fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metodo VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'Completado'
);

CREATE TABLE IF NOT EXISTS Facturas (
  id_factura SERIAL PRIMARY KEY,
  id_pago INTEGER REFERENCES Pagos(id_pago) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
  detalle VARCHAR(255),
  total DECIMAL(10,2),
  fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Tickets (
  id_ticket SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
  asunto VARCHAR(150),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'Abierto',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Mensajes (
  id_mensaje SERIAL PRIMARY KEY,
  id_ticket INTEGER REFERENCES Tickets(id_ticket) ON DELETE CASCADE,
  emisor VARCHAR(20),
  contenido TEXT,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON Usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_peliculas_tipo ON Peliculas(tipo);
CREATE INDEX IF NOT EXISTS idx_peliculas_genero ON Peliculas(genero);
CREATE INDEX IF NOT EXISTS idx_alquileres_usuario ON Alquileres(id_usuario);
CREATE INDEX IF NOT EXISTS idx_alquileres_pelicula ON Alquileres(id_pelicula);
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON Suscripciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON Pagos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tickets_usuario ON Tickets(id_usuario);
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket ON Mensajes(id_ticket);

