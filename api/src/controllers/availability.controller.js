const { supabaseAdmin } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { generateSlots, TIMEZONE } = require('../services/availability.service');

const ensureProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, slot_duration_minutes')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// ---------- SCHEDULES ----------

const createSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await ensureProfile(userId);
    if (!profile) return errorResponse(res, 'Debes crear tu perfil antes de configurar disponibilidad', 400);

    const { day_of_week, start_time, end_time, is_active = true } = req.body;
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .insert([{ user_id: userId, day_of_week: Number(day_of_week), start_time, end_time, is_active }])
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, data, 'Franja horaria creada', 201);
  } catch (error) {
    console.error('createSchedule error:', error);
    return errorResponse(res, 'Error al crear franja horaria', 500);
  }
};

const listMySchedules = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return successResponse(res, data, 'Franjas obtenidas');
  } catch (error) {
    console.error('listMySchedules error:', error);
    return errorResponse(res, 'Error al listar franjas', 500);
  }
};

const updateSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { day_of_week, start_time, end_time, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .update({
        day_of_week: Number(day_of_week),
        start_time,
        end_time,
        ...(is_active !== undefined ? { is_active } : {})
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Franja no encontrada', 404);
    return successResponse(res, data, 'Franja actualizada');
  } catch (error) {
    console.error('updateSchedule error:', error);
    return errorResponse(res, 'Error al actualizar franja', 500);
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Franja no encontrada', 404);
    return successResponse(res, data, 'Franja eliminada');
  } catch (error) {
    console.error('deleteSchedule error:', error);
    return errorResponse(res, 'Error al eliminar franja', 500);
  }
};

// ---------- EXCEPTIONS ----------

const createException = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await ensureProfile(userId);
    if (!profile) return errorResponse(res, 'Debes crear tu perfil antes de configurar disponibilidad', 400);

    const { exception_date, type, start_time, end_time, reason } = req.body;
    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .insert([{ user_id: userId, exception_date, type, start_time, end_time, reason: reason || null }])
      .select()
      .single();
    if (error) throw error;
    return successResponse(res, data, 'Excepción creada', 201);
  } catch (error) {
    console.error('createException error:', error);
    return errorResponse(res, 'Error al crear excepción', 500);
  }
};

const listMyExceptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .select('*')
      .eq('user_id', userId)
      .order('exception_date', { ascending: true });
    if (error) throw error;
    return successResponse(res, data, 'Excepciones obtenidas');
  } catch (error) {
    console.error('listMyExceptions error:', error);
    return errorResponse(res, 'Error al listar excepciones', 500);
  }
};

const deleteException = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Excepción no encontrada', 404);
    return successResponse(res, data, 'Excepción eliminada');
  } catch (error) {
    console.error('deleteException error:', error);
    return errorResponse(res, 'Error al eliminar excepción', 500);
  }
};

// ---------- SLOTS (público) ----------

const getSlots = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id, slot_duration_minutes, professional_type, specialization')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return errorResponse(res, 'Profesional no encontrado', 404);

    const { data: schedules, error: sErr } = await supabaseAdmin
      .from('availability_schedules')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (sErr) throw sErr;

    const { data: exceptions, error: eErr } = await supabaseAdmin
      .from('availability_exceptions')
      .select('exception_date, type, start_time, end_time')
      .eq('user_id', userId)
      .gte('exception_date', from)
      .lte('exception_date', to);
    if (eErr) throw eErr;

    const slots = generateSlots({
      profile,
      schedules: schedules || [],
      exceptions: exceptions || [],
      fromDate: from,
      toDate: to
    });

    return successResponse(res, {
      user_id: userId,
      timezone: TIMEZONE,
      slot_duration_minutes: profile.slot_duration_minutes || 60,
      from,
      to,
      total: slots.length,
      slots
    }, 'Slots generados');
  } catch (error) {
    console.error('getSlots error:', error);
    return errorResponse(res, 'Error al generar slots', 500);
  }
};

module.exports = {
  createSchedule, listMySchedules, updateSchedule, deleteSchedule,
  createException, listMyExceptions, deleteException,
  getSlots
};
