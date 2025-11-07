import Joi from 'joi';
import { query } from '../config/postgres.js';
import { calcularPrecioDia } from '../utils/priceCalculator.js';

const movieSchema = Joi.object({
  titulo: Joi.string().max(150).required(),
  genero: Joi.string().max(100).required(),
  tipo: Joi.string().max(50).required(),
  anio: Joi.number().integer().min(1900).max(2100).required(),
  descripcion: Joi.string().allow(''),
  imagen: Joi.string().max(255).allow(''),
  precio_dia: Joi.number().min(0).optional()
});

export async function list(req, res) {
  try {
    const { q = '', genero = '', anio = '', tipo = '' } = req.query;
    
    let sql = 'SELECT * FROM Peliculas WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (q) {
      sql += ` AND (titulo ILIKE $${paramCount} OR descripcion ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }
    if (genero) {
      sql += ` AND genero = $${paramCount}`;
      params.push(genero);
      paramCount++;
    }
    if (anio) {
      sql += ` AND anio = $${paramCount}`;
      params.push(Number(anio));
      paramCount++;
    }
    if (tipo) {
      sql += ` AND tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }

    sql += ' ORDER BY id_pelicula DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar películas:', err);
    res.status(500).json({ error: 'Error al listar películas' });
  }
}

export async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await query(
      'SELECT * FROM Peliculas WHERE id_pelicula = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener película:', err);
    res.status(500).json({ error: 'Error al obtener película' });
  }
}

export async function create(req, res) {
  const { error, value } = movieSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    // Si no se proporciona precio_dia, calcularlo dinámicamente
    let precioDia = value.precio_dia;
    if (!precioDia || precioDia <= 0) {
      precioDia = calcularPrecioDia({
        tipo: value.tipo,
        anio: value.anio,
        genero: value.genero
      });
    }
    
    const result = await query(
      'INSERT INTO Peliculas (titulo, genero, tipo, anio, descripcion, imagen, precio_dia) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [value.titulo, value.genero, value.tipo, value.anio, value.descripcion || '', value.imagen || '', precioDia]
    );

    res.status(201).json({ ok: true, pelicula: result.rows[0] });
  } catch (err) {
    console.error('Error al crear película:', err);
    res.status(500).json({ error: 'Error al crear película' });
  }
}

export async function update(req, res) {
  const id = Number(req.params.id);
  const { error, value } = movieSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const result = await query(
      'UPDATE Peliculas SET titulo = $1, genero = $2, tipo = $3, anio = $4, descripcion = $5, imagen = $6 WHERE id_pelicula = $7 RETURNING *',
      [value.titulo, value.genero, value.tipo, value.anio, value.descripcion || '', value.imagen || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json({ ok: true, pelicula: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar película:', err);
    res.status(500).json({ error: 'Error al actualizar película' });
  }
}

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await query(
      'DELETE FROM Peliculas WHERE id_pelicula = $1 RETURNING id_pelicula',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al eliminar película:', err);
    res.status(500).json({ error: 'Error al eliminar película' });
  }
}

