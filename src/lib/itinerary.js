export const AVG_KM_PER_MIN = 0.5;
export const MIN_TRAVEL_MIN = 10;

export function travelMinutes(fromKm, toKm) {
  const a = Number(fromKm) || 0;
  const b = Number(toKm) || 0;
  return Math.max(
    MIN_TRAVEL_MIN,
    Math.round(Math.abs(b - a) / AVG_KM_PER_MIN)
  );
}

export function recommendedOrder(ids, byId) {
  return [...ids].sort((a, b) => {
    const pa = byId(a);
    const pb = byId(b);
    return (pa?.distanceKm || 0) - (pb?.distanceKm || 0);
  });
}

export function minutesLabel(m) {
  if (!m || m <= 0) return "";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm} min`;
  if (mm === 0) return `${h} h`;
  return `${h} h ${mm} min`;
}

export function fmtTime(mins) {
  const h = Math.floor((mins / 60) % 24);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseClock(value) {
  const [hh, mm] = String(value || "08:00").split(":");
  return Number(hh) * 60 + Number(mm);
}

export function buildSchedule(items, startTime, travel = travelMinutes) {
  let running = parseClock(startTime);
  return items.map((it, i) => {
    const prev = i > 0 ? items[i - 1].place : null;
    const travelMin = prev ? travel(prev.distanceKm, it.place.distanceKm) : 0;
    if (i > 0) running += travelMin;
    const start = running;
    const end = start + Number(it.durationMin || 0);
    running = end;
    return { ...it, travel: travelMin, start, end };
  });
}

export function totalDuration(schedule) {
  if (!schedule.length) return 0;
  return schedule[schedule.length - 1].end - schedule[0].start;
}
