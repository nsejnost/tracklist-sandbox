/** 754 -> "12:34", 4515 -> "1:15:15" */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** 331 -> "5:31 /km" */
export function formatPace(secPerKm: number): string {
  return `${formatDuration(secPerKm)} /km`;
}

/** 10.4 -> "10.40 km" */
export function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`;
}
