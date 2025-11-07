import Joi from 'joi';
import { query } from '../config/postgres.js';
import { createPaymentAndInvoice } from './payments.controller.js';
import { charge } from '../services/fakeGateway.js';

const schema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  id_pelicula: Joi.number().integer().required(),
  estado: Joi.string().max(20).default('Activo')
});

export async function list(req, res) {
  try {
    // Obtener el id_usuario del token JWT
    const idUsuario = req.user?.sub;
    
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log('📋 Listando alquileres para usuario:', idUsuario);
    
    // Filtrar alquileres por usuario y unir con información de películas
    const result = await query(
      `SELECT a.*, p.titulo, p.genero, p.tipo, p.imagen, p.anio
       FROM Alquileres a
       JOIN Peliculas p ON a.id_pelicula = p.id_pelicula
       WHERE a.id_usuario = $1
       ORDER BY a.fecha_alquiler DESC`,
      [idUsuario]
    );
    
    console.log(`✅ Se encontraron ${result.rows.length} alquileres para el usuario ${idUsuario}`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al listar alquileres:', err);
    res.status(500).json({ error: 'Error al listar alquileres' });
  }
}

export async function create(req, res) {
  const { error, value } = schema.validate(req.body);
  if (error) {
    console.log('❌ Error de validación en alquiler:', error.message);
    return res.status(400).json({ error: error.message });
  }
  
  console.log('📝 Intentando crear alquiler:', value);
  
  try {
    // Verificar que el usuario existe
    const userCheck = await query(
      'SELECT id_usuario FROM Usuarios WHERE id_usuario = $1',
      [value.id_usuario]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️  Usuario no encontrado:', value.id_usuario);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar que la película existe
    const movieCheck = await query(
      'SELECT id_pelicula FROM Peliculas WHERE id_pelicula = $1',
      [value.id_pelicula]
    );
    
    if (movieCheck.rows.length === 0) {
      console.log('⚠️  Película no encontrada:', value.id_pelicula);
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    // Verificar si ya existe un alquiler activo para este usuario y película
    const existingRental = await query(
      'SELECT id_alquiler, estado FROM Alquileres WHERE id_usuario = $1 AND id_pelicula = $2 AND estado = $3',
      [value.id_usuario, value.id_pelicula, 'Activo']
    );
    
    if (existingRental.rows.length > 0) {
      console.log('⚠️  Ya existe un alquiler activo para esta película');
      return res.status(400).json({ 
        error: 'Ya tienes un alquiler activo para esta película/serie',
        alquiler_existente: existingRental.rows[0]
      });
    }
    
    // Crear el alquiler
    const result = await query(
      'INSERT INTO Alquileres (id_usuario, id_pelicula, estado) VALUES ($1, $2, $3) RETURNING *',
      [value.id_usuario, value.id_pelicula, value.estado || 'Activo']
    );
    
    console.log('✅ Alquiler creado exitosamente:', result.rows[0]);
    res.status(201).json({ ok: true, alquiler: result.rows[0] });
  } catch (err) {
    console.error('❌ Error al crear alquiler:', err);
    console.error('   Detalles:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
      error: 'Error al crear alquiler',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Verifica si un usuario tiene un alquiler activo para una película
 */
export async function checkRental(req, res) {
  try {
    const idUsuario = req.user?.sub;
    const idPelicula = parseInt(req.params.id);
    
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const result = await query(
      `SELECT a.*, p.titulo, p.tipo 
       FROM Alquileres a
       JOIN Peliculas p ON a.id_pelicula = p.id_pelicula
       WHERE a.id_usuario = $1 AND a.id_pelicula = $2 AND a.estado = 'Activo'
       ORDER BY a.fecha_alquiler DESC
       LIMIT 1`,
      [idUsuario, idPelicula]
    );
    
    if (result.rows.length > 0) {
      res.json({ 
        tiene_alquiler: true, 
        alquiler: result.rows[0] 
      });
    } else {
      res.json({ 
        tiene_alquiler: false 
      });
    }
  } catch (err) {
    console.error('❌ Error al verificar alquiler:', err);
    res.status(500).json({ error: 'Error al verificar alquiler' });
  }
}

/**
 * Cancela un alquiler (cambia el estado a 'Cancelado')
 */
export async function cancel(req, res) {
  try {
    const idUsuario = req.user?.sub;
    const idAlquiler = parseInt(req.params.id);
    
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    // Verificar que el alquiler pertenece al usuario
    const rentalCheck = await query(
      'SELECT * FROM Alquileres WHERE id_alquiler = $1 AND id_usuario = $2',
      [idAlquiler, idUsuario]
    );
    
    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Alquiler no encontrado o no tienes permiso para cancelarlo' });
    }
    
    if (rentalCheck.rows[0].estado !== 'Activo') {
      return res.status(400).json({ error: 'Solo se pueden cancelar alquileres activos' });
    }
    
    // Actualizar el estado a 'Cancelado'
    const result = await query(
      'UPDATE Alquileres SET estado = $1 WHERE id_alquiler = $2 RETURNING *',
      ['Cancelado', idAlquiler]
    );
    
    console.log('✅ Alquiler cancelado exitosamente:', result.rows[0]);
    res.json({ ok: true, alquiler: result.rows[0] });
  } catch (err) {
    console.error('❌ Error al cancelar alquiler:', err);
    res.status(500).json({ error: 'Error al cancelar alquiler' });
  }
}

/**
 * Extiende un alquiler (actualiza la fecha de alquiler para extender el período)
 * También registra el pago de la extensión en el historial
 */
export async function extend(req, res) {
  try {
    const idUsuario = Number(req.user?.sub);
    const idAlquiler = parseInt(req.params.id);
    const { dias_adicionales, metodo_pago = 'tarjeta' } = req.body;
    
    console.log('📝 Iniciando extensión de alquiler:', {
      idUsuario,
      idAlquiler,
      dias_adicionales,
      metodo_pago,
      user: req.user
    });
    
    if (!idUsuario || isNaN(idUsuario)) {
      console.log('⚠️  Usuario no autenticado o ID inválido');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!dias_adicionales || dias_adicionales <= 0 || isNaN(dias_adicionales)) {
      return res.status(400).json({ error: 'Debes especificar un número válido de días adicionales' });
    }
    
    if (isNaN(idAlquiler)) {
      return res.status(400).json({ error: 'ID de alquiler inválido' });
    }
    
    // Verificar que el alquiler pertenece al usuario y está activo, y obtener información de la película
    const rentalCheck = await query(
      `SELECT a.*, p.titulo, p.precio_dia, p.tipo 
       FROM Alquileres a
       JOIN Peliculas p ON a.id_pelicula = p.id_pelicula
       WHERE a.id_alquiler = $1 AND a.id_usuario = $2 AND a.estado = $3`,
      [idAlquiler, idUsuario, 'Activo']
    );
    
    if (rentalCheck.rows.length === 0) {
      console.log('⚠️  Alquiler activo no encontrado:', { idAlquiler, idUsuario });
      return res.status(404).json({ error: 'Alquiler activo no encontrado' });
    }
    
    const alquiler = rentalCheck.rows[0];
    const precioDia = parseFloat(alquiler.precio_dia) || 0;
    
    if (precioDia <= 0) {
      console.log('⚠️  Precio no configurado para película:', alquiler.id_pelicula);
      return res.status(400).json({ error: 'La película/serie no tiene un precio configurado' });
    }
    
    // Calcular el monto total de la extensión
    const montoTotal = precioDia * parseInt(dias_adicionales);
    
    console.log('📝 Extendiendo alquiler:', {
      id_alquiler: idAlquiler,
      pelicula: alquiler.titulo,
      dias_adicionales,
      precio_dia: precioDia,
      monto_total: montoTotal
    });
    
    // Procesar pago con el gateway simulado
    console.log('🔄 Procesando pago de extensión con gateway...');
    const gatewayRes = await charge({ 
      amount: montoTotal, 
      method: metodo_pago, 
      metadata: { type: 'extension_alquiler', id_alquiler: idAlquiler, dias_adicionales } 
    });
    
    if (gatewayRes.status !== 'succeeded') {
      console.log('❌ Pago de extensión rechazado por el gateway');
      return res.status(402).json({ error: 'Pago rechazado' });
    }
    
    console.log('✅ Pago de extensión aprobado por el gateway');
    
    // Crear pago y factura en el historial
    const pago = await createPaymentAndInvoice(
      { 
        id_usuario: idUsuario, 
        tipo: 'Extensión de Alquiler', 
        monto: montoTotal, 
        metodo: metodo_pago 
      }, 
      `Extensión de ${dias_adicionales} día(s) adicional(es) para: ${alquiler.titulo} (${alquiler.tipo})`
    );
    
    // Actualizar la fecha de alquiler (extender el período)
    const result = await query(
      'UPDATE Alquileres SET fecha_alquiler = CURRENT_TIMESTAMP WHERE id_alquiler = $1 RETURNING *',
      [idAlquiler]
    );
    
    console.log('✅ Alquiler extendido exitosamente:', result.rows[0]);
    res.json({ 
      ok: true, 
      alquiler: result.rows[0],
      dias_extendidos: parseInt(dias_adicionales),
      monto_pagado: montoTotal,
      pago: pago
    });
  } catch (err) {
    console.error('❌ Error al extender alquiler:', err);
    console.error('   Detalles:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
      error: 'Error al extender alquiler',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

