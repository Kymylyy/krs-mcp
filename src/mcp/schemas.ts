import { z } from "zod";

export const searchSchema = z
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

export const getKrsSchema = z.object({ krs: z.string().min(1) }).strict();

export const extractSchema = z
  .object({
    krs: z.string().min(1),
    register: z.enum(["P", "S"]).optional(),
    type: z.enum(["current", "full"]).optional()
  })
  .strict();

export const changesSchema = z
  .object({
    date: z.string().min(10),
    hour_from: z.number().int().min(0).max(23).optional(),
    hour_to: z.number().int().min(0).max(23).optional()
  })
  .strict();

export const getRdnSchema = z.object({ rdn: z.string().min(1) }).strict();
export const voivodeshipsSchema = z.object({ query: z.string().optional() }).strict();

export const countiesSchema = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().optional()
  })
  .strict();

export const municipalitiesSchema = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().min(1),
    municipality: z.string().optional()
  })
  .strict();

export const localitiesSchema = z
  .object({
    voivodeship: z.string().min(1),
    county: z.string().min(1),
    municipality: z.string().min(1),
    locality: z.string().optional()
  })
  .strict();

export const suggestCitiesSchema = z
  .object({
    query: z.string().min(1),
    voivodeship: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional()
  })
  .strict();

export const suggestStreetsSchema = z
  .object({
    query: z.string().min(1),
    voivodeship: z.string().optional(),
    county: z.string().optional(),
    municipality: z.string().optional(),
    locality: z.string().optional()
  })
  .strict();

export const suggestPostalCodesSchema = z
  .object({
    locality: z.string().min(1),
    street: z.string().optional()
  })
  .strict();

export const lookupByCitySchema = z.object({ city: z.string().min(1) }).strict();

export const validateAddressSchema = z
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
