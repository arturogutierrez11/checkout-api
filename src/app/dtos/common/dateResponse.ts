export function requiredDateISOString(
  value: unknown,
  fieldName: string,
  fallbackValue?: unknown,
): string {
  const date = normalizeDate(value) ?? normalizeDate(fallbackValue);

  if (!date) {
    console.warn(`Invalid date field in response: ${fieldName}`);
    return new Date(0).toISOString();
  }

  return date.toISOString();
}

export function nullableDateISOString(value: unknown): string | null {
  return normalizeDate(value)?.toISOString() ?? null;
}

function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
