const { supabaseAdmin } = require('../config/database');
const {
  TIMEZONE,
  generateSlots,
  timeToMinutes,
  minutesToTime
} = require('./availability.service');

const ACTIVE_STATUSES = ['pending', 'confirmed'];

const getChileToday = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(new Date());
};

const computeEndTime = (startTime, durationMinutes) => {
  const startMin = timeToMinutes(startTime);
  return minutesToTime(startMin + durationMinutes);
};

const isPastDate = (date) => date < getChileToday();

const slotMatchesGenerated = ({ profile, schedules, exceptions, date, startTime, endTime }) => {
  const slots = generateSlots({
    profile,
    schedules,
    exceptions,
    fromDate: date,
    toDate: date
  });
  return slots.some(
    (s) =>
      s.date === date &&
      s.start_time === startTime &&
      s.end_time === endTime
  );
};

const hasOverlap = async ({ professionalId, date, startTime, endTime, excludeId = null }) => {
  let query = supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time')
    .eq('professional_id', professionalId)
    .eq('booking_date', date)
    .in('status', ACTIVE_STATUSES)
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).length > 0;
};

const loadProfessionalContextForDate = async (professionalId, date) => {
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('user_id, slot_duration_minutes')
    .eq('user_id', professionalId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) return null;

  const { data: schedules, error: sErr } = await supabaseAdmin
    .from('availability_schedules')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('user_id', professionalId)
    .eq('is_active', true);
  if (sErr) throw sErr;

  const { data: exceptions, error: eErr } = await supabaseAdmin
    .from('availability_exceptions')
    .select('exception_date, type, start_time, end_time')
    .eq('user_id', professionalId)
    .eq('exception_date', date);
  if (eErr) throw eErr;

  return { profile, schedules: schedules || [], exceptions: exceptions || [] };
};

module.exports = {
  ACTIVE_STATUSES,
  getChileToday,
  isPastDate,
  computeEndTime,
  slotMatchesGenerated,
  hasOverlap,
  loadProfessionalContextForDate
};
