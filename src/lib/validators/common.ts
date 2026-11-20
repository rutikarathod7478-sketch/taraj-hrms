export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function isValid10DigitPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function isValidAadhar(aadhar: string): boolean {
  if (!aadhar || typeof aadhar !== 'string') return false;
  const digits = aadhar.replace(/\D/g, '');
  return digits.length === 12;
}

export function isValidPan(pan: string): boolean {
  if (!pan || typeof pan !== 'string') return false;
  const cleaned = pan.trim().toUpperCase();
  // Standard Indian PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(cleaned);
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
