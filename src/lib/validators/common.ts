export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

export function sanitizeText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim();
}

export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    const val = data[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      missingFields.push(String(field));
    }
  }
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
