import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/postgres.js';

const registerSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  correo: Joi.string().email().max(150).required(),
  contrasena: Joi.string().min(6).max(100).required()
});

export async function register(req, res) {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    console.log('❌ Error de validación:', error.message);
    return res.status(400).json({ error: error.message });
  }

  const { nombre, correo, contrasena } = value;
  
  console.log('📝 Intentando registrar usuario:', { nombre, correo });
  
  try {
    // Verificar si el correo ya existe
    const existingUser = await query(
      'SELECT id_usuario FROM Usuarios WHERE correo = $1',
      [correo]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Correo ya registrado:', correo);
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    console.log('🔐 Contraseña hasheada correctamente');

    // Crear usuario
    const result = await query(
      'INSERT INTO Usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING id_usuario',
      [nombre, correo, hashedPassword, 'user']
    );

    console.log('✅ Usuario registrado exitosamente:', result.rows[0].id_usuario);
    res.status(201).json({ ok: true, id_usuario: result.rows[0].id_usuario });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    console.error('   Detalles:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

const loginSchema = Joi.object({
  correo: Joi.string().email().max(150).required(),
  contrasena: Joi.string().min(6).max(100).required()
});

export async function login(req, res) {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { correo, contrasena } = value;
  
  try {
    // Buscar usuario (incluyendo nombre)
    const result = await query(
      'SELECT id_usuario, nombre, correo, contrasena, rol FROM Usuarios WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const ok = await bcrypt.compare(contrasena, usuario.contrasena);
    
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { sub: usuario.id_usuario, role: usuario.rol },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    
    // Devolver token y datos del usuario (sin la contraseña)
    res.json({ 
      token,
      user: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

/**
 * Obtiene la información del usuario autenticado
 */
export async function getCurrentUser(req, res) {
  try {
    const idUsuario = req.user?.sub;
    
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const result = await query(
      'SELECT id_usuario, nombre, correo, rol FROM Usuarios WHERE id_usuario = $1',
      [idUsuario]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
}

