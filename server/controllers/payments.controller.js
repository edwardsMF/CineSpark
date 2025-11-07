import Joi from 'joi';
import { charge } from '../services/fakeGateway.js';
import { query } from '../config/postgres.js';

const rentalSchema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  id_pelicula: Joi.number().integer().required(),
  monto: Joi.number().precision(2).positive().required(),
  metodo: Joi.string().max(50).required()
});

const subscriptionSchema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  tipo: Joi.string().max(50).required(),
  monto: Joi.number().precision(2).positive().required(),
  metodo: Joi.string().max(50).required()
});

export async function createPaymentAndInvoice({ id_usuario, tipo, monto, metodo }, detalle) {
  try {
    console.log('💰 Creando pago y factura:', { id_usuario, tipo, monto, metodo, detalle });
    
    // Crear pago
    const pagoResult = await query(
      'INSERT INTO Pagos (id_usuario, tipo, monto, metodo, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id_usuario, tipo, monto, metodo, 'Completado']
    );
    const pago = pagoResult.rows[0];
    console.log('✅ Pago creado:', pago.id_pago);

    // Crear factura
    const facturaResult = await query(
      'INSERT INTO Facturas (id_pago, id_usuario, detalle, total) VALUES ($1, $2, $3, $4) RETURNING *',
      [pago.id_pago, id_usuario, detalle, monto]
    );
    console.log('✅ Factura creada:', facturaResult.rows[0].id_factura);

    return pago;
  } catch (err) {
    console.error('❌ Error al crear pago y factura:', err);
    console.error('   Detalles:', err.message);
    throw err;
  }
}

export async function payRental(req, res) {
  const { error, value } = rentalSchema.validate(req.body);
  if (error) {
    console.log('❌ Error de validación en pago de alquiler:', error.message);
    return res.status(400).json({ error: error.message });
  }
  
  const { id_usuario, id_pelicula, monto, metodo } = value;
  console.log('💳 Procesando pago de alquiler:', { id_usuario, id_pelicula, monto, metodo });

  try {
    // Verificar que el usuario existe
    const userCheck = await query(
      'SELECT id_usuario FROM Usuarios WHERE id_usuario = $1',
      [id_usuario]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️  Usuario no encontrado:', id_usuario);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar que la película existe
    const movieCheck = await query(
      'SELECT id_pelicula, titulo FROM Peliculas WHERE id_pelicula = $1',
      [id_pelicula]
    );
    
    if (movieCheck.rows.length === 0) {
      console.log('⚠️  Película no encontrada:', id_pelicula);
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    // Procesar pago con el gateway simulado
    console.log('🔄 Procesando pago con gateway...');
    const gatewayRes = await charge({ amount: monto, method: metodo, metadata: { type: 'alquiler', id_pelicula } });
    
    if (gatewayRes.status !== 'succeeded') {
      console.log('❌ Pago rechazado por el gateway');
      return res.status(402).json({ error: 'Pago rechazado' });
    }
    
    console.log('✅ Pago aprobado por el gateway');
    
    // Crear pago y factura en la base de datos
    const pago = await createPaymentAndInvoice(
      { id_usuario, tipo: 'Alquiler', monto, metodo }, 
      `Pago alquiler película: ${movieCheck.rows[0].titulo}`
    );
    
    console.log('✅ Pago de alquiler procesado exitosamente');
    res.status(201).json({ ok: true, pago });
  } catch (err) {
    console.error('❌ Error al procesar pago de alquiler:', err);
    console.error('   Detalles:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
      error: 'Error al procesar pago',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export async function paySubscription(req, res) {
  const { error, value } = subscriptionSchema.validate(req.body);
  if (error) {
    console.log('❌ Error de validación en pago de suscripción:', error.message);
    return res.status(400).json({ error: error.message });
  }
  
  const { id_usuario, tipo, monto, metodo } = value;
  console.log('💳 Procesando pago de suscripción:', { id_usuario, tipo, monto, metodo });

  try {
    // Verificar que el usuario existe
    const userCheck = await query(
      'SELECT id_usuario FROM Usuarios WHERE id_usuario = $1',
      [id_usuario]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️  Usuario no encontrado:', id_usuario);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Procesar pago con el gateway simulado
    console.log('🔄 Procesando pago con gateway...');
    const gatewayRes = await charge({ amount: monto, method: metodo, metadata: { type: 'suscripcion', plan: tipo } });
    
    if (gatewayRes.status !== 'succeeded') {
      console.log('❌ Pago rechazado por el gateway');
      return res.status(402).json({ error: 'Pago rechazado' });
    }
    
    console.log('✅ Pago aprobado por el gateway');
    
    // Crear pago y factura en la base de datos
    const pago = await createPaymentAndInvoice(
      { id_usuario, tipo: 'Suscripción', monto, metodo }, 
      `Pago suscripción ${tipo}`
    );
    
    console.log('✅ Pago de suscripción procesado exitosamente');
    res.status(201).json({ ok: true, pago });
  } catch (err) {
    console.error('❌ Error al procesar pago de suscripción:', err);
    console.error('   Detalles:', err.message);
    res.status(500).json({ 
      error: 'Error al procesar pago',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export async function listUserPayments(req, res) {
  try {
    const idUsuario = Number(req.params.userId);
    const result = await query(
      'SELECT * FROM Pagos WHERE id_usuario = $1 ORDER BY fecha_pago DESC',
      [idUsuario]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar pagos:', err);
    res.status(500).json({ error: 'Error al listar pagos' });
  }
}

