import Joi from 'joi';
import { query } from '../config/postgres.js';

const schema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  tipo: Joi.string().max(50).required(),
  fecha_fin: Joi.date().optional()
});

export async function list(req, res) {
  try {
    const result = await query(
      'SELECT * FROM Suscripciones ORDER BY fecha_inicio DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar suscripciones:', err);
    res.status(500).json({ error: 'Error al listar suscripciones' });
  }
}

export async function create(req, res) {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  
  try {
    const result = await query(
      'INSERT INTO Suscripciones (id_usuario, tipo, fecha_fin) VALUES ($1, $2, $3) RETURNING *',
      [value.id_usuario, value.tipo, value.fecha_fin || null]
    );
    res.status(201).json({ ok: true, suscripcion: result.rows[0] });
  } catch (err) {
    console.error('Error al crear suscripción:', err);
    res.status(500).json({ error: 'Error al crear suscripción' });
  }
}

