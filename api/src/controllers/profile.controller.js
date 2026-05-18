const { supabaseAdmin } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const PUBLIC_FIELDS = `
  id,
  user_id,
  bio,
  specialization,
  professional_type,
  hourly_rate,
  experience_years,
  created_at,
  updated_at,
  users:users!profiles_user_id_fkey ( id, full_name, email, phone, role )
`;

const upsertProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bio,
      specialization,
      professional_type,
      hourly_rate,
      experience_years
    } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      bio,
      specialization,
      professional_type,
      hourly_rate,
      experience_years
    };

    let query;
    if (existing) {
      query = supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('user_id', userId);
    } else {
      query = supabaseAdmin.from('profiles').insert([payload]);
    }

    const { data, error } = await query.select(PUBLIC_FIELDS).single();
    if (error) throw error;

    return successResponse(
      res,
      data,
      existing ? 'Perfil actualizado' : 'Perfil creado',
      existing ? 200 : 201
    );
  } catch (error) {
    console.error('upsertProfile error:', error);
    return errorResponse(res, 'Error al guardar el perfil', 500);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(PUBLIC_FIELDS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Perfil no encontrado', 404);

    return successResponse(res, data, 'Perfil obtenido');
  } catch (error) {
    console.error('getMyProfile error:', error);
    return errorResponse(res, 'Error al obtener el perfil', 500);
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(PUBLIC_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Perfil no encontrado', 404);

    return successResponse(res, data, 'Perfil público obtenido');
  } catch (error) {
    console.error('getPublicProfile error:', error);
    return errorResponse(res, 'Error al obtener el perfil', 500);
  }
};

const listProfiles = async (req, res) => {
  try {
    const {
      professional_type,
      specialization,
      min_rate,
      max_rate,
      min_experience,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select(PUBLIC_FIELDS, { count: 'exact' });

    if (professional_type) query = query.eq('professional_type', professional_type);
    if (specialization) query = query.ilike('specialization', `%${specialization}%`);
    if (min_rate) query = query.gte('hourly_rate', Number(min_rate));
    if (max_rate) query = query.lte('hourly_rate', Number(max_rate));
    if (min_experience) query = query.gte('experience_years', Number(min_experience));

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return successResponse(
      res,
      { items: data, page: pageNum, limit: limitNum, total: count },
      'Listado de profesionales'
    );
  } catch (error) {
    console.error('listProfiles error:', error);
    return errorResponse(res, 'Error al listar profesionales', 500);
  }
};

module.exports = { upsertProfile, getMyProfile, getPublicProfile, listProfiles };
