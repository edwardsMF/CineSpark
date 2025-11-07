import { query } from '../config/postgres.js';

export async function listUserInvoices(req, res) {
  try {
    const idUsuario = Number(req.params.userId);
    const result = await query(
      'SELECT * FROM Facturas WHERE id_usuario = $1 ORDER BY fecha_emision DESC',
      [idUsuario]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar facturas:', err);
    res.status(500).json({ error: 'Error al listar facturas' });
  }
}

