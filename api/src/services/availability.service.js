const TIMEZONE = 'America/Santiago';

const pad2 = (n) => String(n).padStart(2, '0');

const timeToMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
};

const parseDateStr = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m, d };
};

const formatDateUTC = (date) => {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

const subtractRange = (ranges, blockStart, blockEnd) => {
  const result = [];
  for (const r of ranges) {
    if (blockEnd <= r.start || blockStart >= r.end) {
      result.push(r);
      continue;
    }
    if (blockStart > r.start) {
      result.push({ start: r.start, end: Math.min(blockStart, r.end) });
    }
    if (blockEnd < r.end) {
      result.push({ start: Math.max(blockEnd, r.start), end: r.end });
    }
  }
  return result;
};

const mergeRanges = (ranges) => {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged;
};

const diffDays = (fromStr, toStr) => {
  const a = parseDateStr(fromStr);
  const b = parseDateStr(toStr);
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
};

const generateSlots = ({ profile, schedules, exceptions, fromDate, toDate }) => {
  const slotDuration = profile.slot_duration_minutes || 60;
  const slots = [];

  const { y, m, d } = parseDateStr(fromDate);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  const endParts = parseDateStr(toDate);
  const endUTC = Date.UTC(endParts.y, endParts.m - 1, endParts.d);

  const exceptionsByDate = exceptions.reduce((acc, e) => {
    (acc[e.exception_date] = acc[e.exception_date] || []).push(e);
    return acc;
  }, {});

  while (cursor.getTime() <= endUTC) {
    const dateStr = formatDateUTC(cursor);
    const dow = cursor.getUTCDay();
    const dayExceptions = exceptionsByDate[dateStr] || [];
    const blocks = dayExceptions.filter((e) => e.type === 'block');
    const adds = dayExceptions.filter((e) => e.type === 'add');
    const fullDayBlock = blocks.some((b) => !b.start_time);

    let ranges = [];
    if (!fullDayBlock) {
      ranges = schedules
        .filter((s) => s.day_of_week === dow && s.is_active !== false)
        .map((s) => ({
          start: timeToMinutes(s.start_time),
          end: timeToMinutes(s.end_time)
        }));

      for (const b of blocks) {
        if (b.start_time && b.end_time) {
          ranges = subtractRange(ranges, timeToMinutes(b.start_time), timeToMinutes(b.end_time));
        }
      }

      for (const a of adds) {
        if (a.start_time && a.end_time) {
          ranges.push({ start: timeToMinutes(a.start_time), end: timeToMinutes(a.end_time) });
        }
      }

      ranges = mergeRanges(ranges);
    }

    for (const r of ranges) {
      let pos = r.start;
      while (pos + slotDuration <= r.end) {
        slots.push({
          date: dateStr,
          day_of_week: dow,
          start_time: minutesToTime(pos),
          end_time: minutesToTime(pos + slotDuration)
        });
        pos += slotDuration;
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots;
};

module.exports = {
  TIMEZONE,
  generateSlots,
  timeToMinutes,
  minutesToTime,
  diffDays
};
