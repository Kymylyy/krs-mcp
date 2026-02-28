import { KrsValidationError } from "./errors.js";

const DIGITS_ONLY = /^\d+$/;

export function ensureDigits(value: string, label: string): string {
  const trimmed = value.trim();
  if (!DIGITS_ONLY.test(trimmed)) {
    throw new KrsValidationError(`${label} must contain only digits`);
  }
  return trimmed;
}

export function normalizeIdentifier10(value: string, label: string): string {
  const digits = ensureDigits(value, label);
  if (digits.length > 10) {
    throw new KrsValidationError(`${label} must be up to 10 digits`);
  }
  return digits.padStart(10, "0");
}

export function normalizeKrs(value: string): string {
  return normalizeIdentifier10(value, "KRS");
}

export function normalizeRdn(value: string): string {
  return normalizeIdentifier10(value, "RDN");
}

export function normalizeDateIso(value: string, label: string): string {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(value)) {
    throw new KrsValidationError(`${label} must be in YYYY-MM-DD format`);
  }
  return value;
}

export function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, "");
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asBooleanOrNull(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

export function asStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  return null;
}

export function toPaddedKrsList(values: string[]): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) {
      continue;
    }
    set.add(digits.padStart(10, "0"));
  }
  return [...set];
}
