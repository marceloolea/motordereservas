const { supabaseAdmin } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const {
  ACTIVE_STATUSES,
  isPastDate,
  computeEndTime,
  slotMatchesGenerated,
  hasOverlap,
  loadProfessionalContextForDate
} = require('../services/booking.service');

const BOOKING_FIELDS = `
  id, client_id, professional_id, booking_date, start_time, end_time,
  status, notes, cancellation_reason, cancelled_by, cancelled_at,
  confirmed_at, completed_at, created_at, updated_at
`;

const enrichBookings = async (bookings) => {
  if (!bookings) return bookings;
  const isArray = Array.isArray(bookings);
  const list = isArray ? bookings : [bookings];
  if (list.length === 0) return bookings;

  const userIds = [...new Set(list.flatMap((b) => [b.client_id, b.professional_id]))];
  const proIds = [...new Set(list.map((b) => b.professional_id))];

  const [{ data: users }, { data: profs }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, email, phone').in('id', userIds),
    supabaseAdmin
      .from('profiles')
      .select('user_id, professional_type, specialization, hourly_rate, slot_duration_minutes')
      .in('user_id', proIds)
  ]);

  const usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
  const profsById = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));

  list.forEach((b) => {
    b.client = usersById[b.client_id] || null;
    const profile = profsById[b.professional_id] || null;
    b.professional = profile
      ? { ...profile, user: usersById[b.professional_id] || null }
      : { user: usersById[b.professional_id] || null };
  });

  return isArray ? list : list[0];
};

const createBooking = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { professional_id, booking_date, start_time, notes } = req.body;

    if (professional_id === clientId) {
      return errorResponse(res, 'No podés reservarte a vos mismo', 400);
    }
    if (isPastDate(booking_date)) {
      return errorResponse(res, 'No se puede reservar en fechas pasadas', 400);
    }

    const ctx = await loadProfessionalContextForDate(professional_id, booking_date);
    if (!ctx) return errorResponse(res, 'Profesional no encontrado', 404);

    const end_time = computeEndTime(start_time, ctx.profile.slot_duration_minutes);

    const matches = slotMatchesGenerated({
      profile: ctx.profile,
      schedules: ctx.schedules,
      exceptions: ctx.exceptions,
      date: booking_date,
      startTime: start_time,
      endTime: end_time
    });
    if (!matches) {
      return errorResponse(res, 'El horario solicitado no coincide con un slot disponible del profesional', 400);
    }

    const overlap = await hasOverlap({
      professionalId: professional_id,
      date: booking_date,
      startTime: start_time,
      endTime: end_time
    });
    if (overlap) {
      return errorResponse(res, 'Ese horario ya está reservado', 409);
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([{
        client_id: clientId,
        professional_id,
        booking_date,
        start_time,
        end_time,
        status: 'pending',
        notes: notes || null
      }])
      .select(BOOKING_FIELDS)
      .single();
    if (error) throw error;

    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reserva creada en estado pending', 201);
  } catch (error) {
    console.error('createBooking error:', error);
    return errorResponse(res, 'Error al crear la reserva', 500);
  }
};

const listMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { role, from, to, status } = req.query;

    const filterRole = role === 'professional' ? 'professional_id' : 'client_id';

    let query = supabaseAdmin
      .from('bookings')
      .select(BOOKING_FIELDS)
      .eq(filterRole, userId);

    if (from) query = query.gte('booking_date', from);
    if (to) query = query.lte('booking_date', to);
    if (status) query = query.eq('status', status);

    const { data, error } = await query
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) throw error;
    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reservas obtenidas');
  } catch (error) {
    console.error('listMyBookings error:', error);
    return errorResponse(res, 'Error al listar reservas', 500);
  }
};

const getBookingById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_FIELDS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Reserva no encontrada', 404);

    if (data.client_id !== userId && data.professional_id !== userId) {
      return errorResponse(res, 'No tenés acceso a esta reserva', 403);
    }

    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reserva obtenida');
  } catch (error) {
    console.error('getBookingById error:', error);
    return errorResponse(res, 'Error al obtener la reserva', 500);
  }
};

const fetchBookingForAction = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, client_id, professional_id, status, booking_date, start_time')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const confirmBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const booking = await fetchBookingForAction(id);
    if (!booking) return errorResponse(res, 'Reserva no encontrada', 404);
    if (booking.professional_id !== userId) {
      return errorResponse(res, 'Solo el profesional puede confirmar', 403);
    }
    if (booking.status !== 'pending') {
      return errorResponse(res, `No se puede confirmar una reserva en estado '${booking.status}'`, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select(BOOKING_FIELDS)
      .single();
    if (error) throw error;
    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reserva confirmada');
  } catch (error) {
    console.error('confirmBooking error:', error);
    return errorResponse(res, 'Error al confirmar reserva', 500);
  }
};

const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const booking = await fetchBookingForAction(id);
    if (!booking) return errorResponse(res, 'Reserva no encontrada', 404);
    if (booking.client_id !== userId && booking.professional_id !== userId) {
      return errorResponse(res, 'No tenés permiso para cancelar esta reserva', 403);
    }
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      return errorResponse(res, `No se puede cancelar una reserva en estado '${booking.status}'`, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: userId,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null
      })
      .eq('id', id)
      .select(BOOKING_FIELDS)
      .single();
    if (error) throw error;
    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reserva cancelada');
  } catch (error) {
    console.error('cancelBooking error:', error);
    return errorResponse(res, 'Error al cancelar reserva', 500);
  }
};

const completeBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const booking = await fetchBookingForAction(id);
    if (!booking) return errorResponse(res, 'Reserva no encontrada', 404);
    if (booking.professional_id !== userId) {
      return errorResponse(res, 'Solo el profesional puede marcar como completada', 403);
    }
    if (booking.status !== 'confirmed') {
      return errorResponse(res, `No se puede completar una reserva en estado '${booking.status}'`, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select(BOOKING_FIELDS)
      .single();
    if (error) throw error;
    const enriched = await enrichBookings(data);
    return successResponse(res, enriched, 'Reserva completada');
  } catch (error) {
    console.error('completeBooking error:', error);
    return errorResponse(res, 'Error al completar reserva', 500);
  }
};

module.exports = {
  createBooking, listMyBookings, getBookingById,
  confirmBooking, cancelBooking, completeBooking,
  BOOKING_FIELDS
};
