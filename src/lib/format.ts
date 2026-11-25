const tz = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Kuwait';

/** Dates in the dashboard are shown in Gulf time (Kuwait / Qatar / Saudi Arabia are all UTC+3). */
export const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
