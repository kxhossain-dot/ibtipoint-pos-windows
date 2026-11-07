const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time calendar date as YYYY-MM-DD (toISOString() gives the UTC date, which is wrong after midnight in Bangladesh). */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local "YYYY-MM-DD HH:MM" stamp used for orders, expenses and transactions. */
export function localDateTimeStr(d: Date = new Date()): string {
  return `${localDateStr(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
