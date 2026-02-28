import { KrsValidationError } from "./errors.js";
import { normalizeDateIso, toPaddedKrsList } from "./normalize.js";
import type { KrsClient, RegistryChangesOptions, RegistryChangesResult } from "./types.js";

const BULLETIN_CUTOFF = "2021-12-08";

function validateHour(hour: number, label: string): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new KrsValidationError(`${label} must be an integer between 0 and 23`);
  }
}

export async function getRegistryChanges(
  client: KrsClient,
  date: string,
  options: RegistryChangesOptions = {}
): Promise<RegistryChangesResult> {
  const normalizedDate = normalizeDateIso(date, "date");

  if (normalizedDate < BULLETIN_CUTOFF) {
    throw new KrsValidationError(`date must be on or after ${BULLETIN_CUTOFF}`);
  }

  const hasHourFrom = typeof options.hourFrom === "number";
  const hasHourTo = typeof options.hourTo === "number";

  if (hasHourFrom !== hasHourTo) {
    throw new KrsValidationError("hourFrom and hourTo must be both provided or both omitted");
  }

  let path = `Biuletyn/${normalizedDate}`;

  if (hasHourFrom && hasHourTo) {
    validateHour(options.hourFrom as number, "hourFrom");
    validateHour(options.hourTo as number, "hourTo");

    path = `BiuletynGodzinowy/${normalizedDate}?godzinaOd=${options.hourFrom}&godzinaDo=${options.hourTo}`;
  }

  const raw = await client.officialApiGet<string[]>(path);
  const krsNumbers = toPaddedKrsList(raw);

  return {
    date: normalizedDate,
    hourFrom: hasHourFrom ? (options.hourFrom as number) : null,
    hourTo: hasHourTo ? (options.hourTo as number) : null,
    count: krsNumbers.length,
    krsNumbers,
    rawCount: Array.isArray(raw) ? raw.length : 0
  };
}
