const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'client' } = req.body;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return errorResponse(res, 'El email ya está registrado', 409);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ email, password_hash, full_name, phone, role }])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    return successResponse(res, {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      },
      token
    }, 'Usuario registrado exitosamente', 201);

  } catch (error) {
    console.error('Error en register:', error);
    return errorResponse(res, 'Error al registrar usuario', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Usuario inactivo', 403);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    }, 'Login exitoso');

  } catch (error) {
    console.error('Error en login:', error);
    return errorResponse(res, 'Error al iniciar sesión', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    return successResponse(res, { user }, 'Perfil obtenido exitosamente');

  } catch (error) {
    console.error('Error en getProfile:', error);
    return errorResponse(res, 'Error al obtener perfil', 500);
  }
};

module.exports = { register, login, getProfile };
