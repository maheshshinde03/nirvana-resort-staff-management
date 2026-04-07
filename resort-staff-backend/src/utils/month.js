export const MONTH_NAMES = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]);

const normalizeString = (value) =>
  String(value).trim().toLowerCase();

export const toMonthNumber = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 1 && value <= 12) return value;
    return null;
  }

  const raw = normalizeString(value);
  if (!raw) return null;

  // numeric strings: "1".."12"
  if (/^\d+$/.test(raw)) {
    const num = Number(raw);
    if (Number.isInteger(num) && num >= 1 && num <= 12) return num;
    return null;
  }

  // month names (case-insensitive): "January".."December"
  const idx = MONTH_NAMES.findIndex((name) => name.toLowerCase() === raw);
  if (idx !== -1) return idx + 1;

  return null;
};

export const toMonthName = (value) => {
  const num = toMonthNumber(value);
  if (!num) return null;
  return MONTH_NAMES[num - 1];
};

export const monthWhereIn = (value) => {
  const monthName = toMonthName(value);
  const monthNum = toMonthNumber(value);

  if (!monthName || !monthNum) return null;

  // Support legacy numeric-month rows after column becomes STRING
  return [monthName, String(monthNum)];
};

