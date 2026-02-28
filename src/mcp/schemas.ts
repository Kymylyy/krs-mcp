import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

export interface McpToolSchema<T extends z.ZodTypeAny> {
  parser: T;
  inputSchema: Record<string, unknown>;
}

function buildToolSchema<T extends z.ZodTypeAny>(parser: T): McpToolSchema<T> {
  const raw = zodToJsonSchema(parser, {
    target: "jsonSchema7",
    $refStrategy: "none"
  }) as Record<string, unknown>;

  const normalized = { ...raw };
  delete normalized.$schema;
  return {
    parser,
    inputSchema: normalized
  };
}

const searchParser = z
  .object({
    name: z.string().optional(),
    nip: z.string().optional(),
    regon: z.string().optional(),
    krs: z.string().optional(),
    register: z.enum(["P", "S", "both"]).optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional(),
    voivodeship: z.string().optional(),
    opp_only: z.boolean().optional(),
    bankruptcy_only: z.boolean().optional(),
    exact_name: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(1).optional()
  })
  .strict();

const getKrsParser = z.object({ krs: z.string().min(1) }).strict();

const extractParser = z
  .object({
    krs: z.string().min(1),
    register: z.enum(["P", "S"]).optional(),
    type: z.enum(["current", "full"]).optional()
  })
  .strict();

const changesParser = z
  .object({
    date: z.string().min(10),
    hour_from: z.number().int().min(0).max(23).optional(),
    hour_to: z.number().int().min(0).max(23).optional()
  })
  .strict();

const getRdnParser = z.object({ rdn: z.string().min(1) }).strict();
const voivodeshipsParser = z.object({ query: z.string().optional() }).strict();

const countiesParser = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().optional()
  })
  .strict();

const municipalitiesParser = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().min(1),
    municipality: z.string().optional()
  })
  .strict();

const localitiesParser = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().min(1),
    municipality: z.string().min(1),
    locality: z.string().optional()
  })
  .strict();

const suggestCitiesParser = z
  .object({
    query: z.string().min(1),
    voivodeship: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional()
  })
  .strict();

const suggestStreetsParser = z
  .object({
    query: z.string().min(1),
    voivodeship: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional(),
    locality: z.string().optional()
  })
  .strict();

const suggestPostalCodesParser = z
  .object({
    locality: z.string().min(1),
    street: z.string().optional()
  })
  .strict();

const lookupByCityParser = z.object({ city: z.string().min(1) }).strict();

const validateAddressParser = z
  .object({
    voivodeship: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional(),
    locality: z.string().optional(),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    apartmentNumber: z.string().optional(),
    postalCode: z.string().optional()
  })
  .passthrough();

export const searchToolSchema = buildToolSchema(searchParser);
export const registryStatsToolSchema = buildToolSchema(searchParser.partial().strict());
export const getKrsToolSchema = buildToolSchema(getKrsParser);
export const extractToolSchema = buildToolSchema(extractParser);
export const changesToolSchema = buildToolSchema(changesParser);
export const getRdnToolSchema = buildToolSchema(getRdnParser);
export const voivodeshipsToolSchema = buildToolSchema(voivodeshipsParser);
export const countiesToolSchema = buildToolSchema(countiesParser);
export const municipalitiesToolSchema = buildToolSchema(municipalitiesParser);
export const localitiesToolSchema = buildToolSchema(localitiesParser);
export const suggestCitiesToolSchema = buildToolSchema(suggestCitiesParser);
export const suggestStreetsToolSchema = buildToolSchema(suggestStreetsParser);
export const suggestPostalCodesToolSchema = buildToolSchema(suggestPostalCodesParser);
export const lookupByCityToolSchema = buildToolSchema(lookupByCityParser);
export const validateAddressToolSchema = buildToolSchema(validateAddressParser);
