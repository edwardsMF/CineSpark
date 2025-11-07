export const mockPeliculas = [
  { id_pelicula: 1, titulo: 'Horizonte Rojo', genero: 'Acción', tipo: 'Película', anio: 2023, descripcion: 'Un agente lucha contra un sistema corrupto.', imagen: 'pelicula_HorizonteRojo.png' },
  { id_pelicula: 2, titulo: 'Sombras Eternas', genero: 'Terror', tipo: 'Película', anio: 2022, descripcion: 'Una familia enfrenta su pasado en una casa maldita.', imagen: 'pelicula_SombrasEternas.png' },
  { id_pelicula: 3, titulo: 'Tiempo Muerto', genero: 'Ciencia Ficción', tipo: 'Serie', anio: 2024, descripcion: 'Viajes en el tiempo con consecuencias impredecibles.', imagen: 'serie_TiempoMuerto.png' },
  { id_pelicula: 4, titulo: 'Guardianes del Alba', genero: 'Fantasía', tipo: 'Serie', anio: 2023, descripcion: 'Un grupo de héroes lucha contra la oscuridad.', imagen: 'serie_GuardianesDelAlba.png' },
  { id_pelicula: 5, titulo: 'Neon City', genero: 'Acción', tipo: 'Juego', anio: 2022, descripcion: 'Aventura cyberpunk llena de batallas y caos.', imagen: 'juego_NeonCity.png' },
  { id_pelicula: 6, titulo: 'Reino Perdido', genero: 'Aventura', tipo: 'Juego', anio: 2023, descripcion: 'Explora un mundo olvidado lleno de misterios.', imagen: 'juego_ReinoPerdido.png' }
];

export const mockUsuarios = [
  { id_usuario: 1, nombre: 'Admin', correo: 'admin@cinespark.com', rol: 'admin' },
  { id_usuario: 2, nombre: 'Usuario', correo: 'user@cinespark.com', rol: 'user' }
];

export const mockTickets = [
  { id_ticket: 1, id_usuario: 2, asunto: 'No puedo reproducir', estado: 'Abierto', fecha_creacion: '2025-10-01' },
  { id_ticket: 2, id_usuario: 2, asunto: 'Cobro duplicado', estado: 'Cerrado', fecha_creacion: '2025-10-03' }
];

export const mockMensajesPorTicket = {
  1: [
    { id_mensaje: 1, emisor: 'user', contenido: 'No reproduce el video.', fecha_envio: '2025-10-01' },
    { id_mensaje: 2, emisor: 'admin', contenido: '¿Qué dispositivo usas?', fecha_envio: '2025-10-01' }
  ],
  2: [
    { id_mensaje: 3, emisor: 'user', contenido: 'Me cobraron dos veces.', fecha_envio: '2025-10-03' },
    { id_mensaje: 4, emisor: 'admin', contenido: 'Ya lo devolvimos.', fecha_envio: '2025-10-04' }
  ]
};

