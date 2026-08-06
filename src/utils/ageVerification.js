const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseBirthDate(value) {
  const match = String(value || '').match(ISO_DATE);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function calendarParts(value = new Date()) {
  if (value && typeof value === 'object' && Number.isInteger(value.year)) {
    return { year: value.year, month: value.month, day: value.day };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function calculateAge(birthDate, today = new Date()) {
  const birth = typeof birthDate === 'string' ? parseBirthDate(birthDate) : birthDate;
  const current = calendarParts(today);
  if (!birth || !current) return null;

  let age = current.year - birth.year;
  if (current.month < birth.month || (current.month === birth.month && current.day < birth.day)) age -= 1;
  return age;
}

export function verifyMinimumAge(birthDate, minimumAge = 18, today = new Date()) {
  const birth = typeof birthDate === 'string' ? parseBirthDate(birthDate) : birthDate;
  const current = calendarParts(today);
  if (!birth || !current || !Number.isInteger(minimumAge) || minimumAge < 0) {
    return { valid: false, eligible: false, age: null, reason: 'invalid' };
  }

  const birthComparable = birth.year * 10000 + birth.month * 100 + birth.day;
  const todayComparable = current.year * 10000 + current.month * 100 + current.day;
  if (birthComparable > todayComparable) {
    return { valid: false, eligible: false, age: null, reason: 'future' };
  }

  const age = calculateAge(birth, current);
  return { valid: true, eligible: age >= minimumAge, age, reason: age >= minimumAge ? 'eligible' : 'underage' };
}

export function todayIso(value = new Date()) {
  const current = calendarParts(value);
  if (!current) return '';
  return `${String(current.year).padStart(4, '0')}-${String(current.month).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;
}
