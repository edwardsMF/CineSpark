import Joi from 'joi';
import { query } from '../config/postgres.js';

const ticketSchema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  asunto: Joi.string().max(150).required(),
  descripcion: Joi.string().max(1000).required()
});

const messageSchema = Joi.object({
  emisor: Joi.string().valid('user', 'admin').required(),
  contenido: Joi.string().max(1000).required()
});

export async function createTicket(req, res) {
  const { error, value } = ticketSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  
  try {
    const result = await query(
      'INSERT INTO Tickets (id_usuario, asunto, descripcion, estado) VALUES ($1, $2, $3, $4) RETURNING *',
      [value.id_usuario, value.asunto, value.descripcion, 'Abierto']
    );
    res.status(201).json({ ok: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Error al crear ticket:', err);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
}

export async function getUserTickets(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await query(
      'SELECT id_ticket, asunto, estado, fecha_creacion FROM Tickets WHERE id_usuario = $1 ORDER BY fecha_creacion DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar tickets:', err);
    res.status(500).json({ error: 'Error al listar tickets' });
  }
}

export async function getTicketById(req, res) {
  try {
    const id = Number(req.params.id);
    
    // Obtener ticket
    const ticketResult = await query(
      'SELECT * FROM Tickets WHERE id_ticket = $1',
      [id]
    );
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    // Obtener mensajes
    const mensajesResult = await query(
      'SELECT * FROM Mensajes WHERE id_ticket = $1 ORDER BY fecha_envio ASC',
      [id]
    );
    
    res.json({ 
      ticket: ticketResult.rows[0],
      mensajes: mensajesResult.rows
    });
  } catch (err) {
    console.error('Error al obtener ticket:', err);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
}

export async function addMessage(req, res) {
  const id = Number(req.params.id);
  const { error, value } = messageSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  
  try {
    // Verificar que el ticket existe
    const ticketResult = await query(
      'SELECT id_ticket FROM Tickets WHERE id_ticket = $1',
      [id]
    );
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    // Agregar mensaje
    await query(
      'INSERT INTO Mensajes (id_ticket, emisor, contenido) VALUES ($1, $2, $3) RETURNING *',
      [id, value.emisor, value.contenido]
    );
    
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error al agregar mensaje:', err);
    res.status(500).json({ error: 'Error al agregar mensaje' });
  }
}

export async function getAllTickets(req, res) {
  try {
    const result = await query(
      'SELECT id_ticket, id_usuario, asunto, estado, fecha_creacion FROM Tickets ORDER BY fecha_creacion DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar todos los tickets:', err);
    res.status(500).json({ error: 'Error al listar tickets' });
  }
}

