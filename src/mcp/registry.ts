import {
  getDebtorDetails,
  getEntityBoard,
  getEntityDetails,
  getEntityExtract,
  getRegistryChanges,
  getRegistryStats,
  listCounties,
  listLocalities,
  listMunicipalities,
  listVoivodeships,
  lookupAdminByCity,
  searchEntities,
  suggestCities,
  suggestPostalCodes,
  suggestStreets,
  validateAddress
} from "../lib/index.js";
import type { KrsClient } from "../lib/types.js";
import {
  changesSchema,
  countiesSchema,
  extractSchema,
  getKrsSchema,
  getRdnSchema,
  localitiesSchema,
  lookupByCitySchema,
  municipalitiesSchema,
  searchSchema,
  suggestCitiesSchema,
  suggestPostalCodesSchema,
  suggestStreetsSchema,
  validateAddressSchema,
  voivodeshipsSchema
} from "./schemas.js";
import type { RegisteredTool } from "./types.js";

export function createRegisteredTools(client: KrsClient): RegisteredTool[] {
  return [
    {
      tool: {
        name: "search_entities",
        description: "Search entities in KRS by identifiers, name or location.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            nip: { type: "string" },
            regon: { type: "string" },
            krs: { type: "string" },
            register: { type: "string", enum: ["P", "S", "both"] },
            city: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" },
            voivodeship: { type: "string" },
            opp_only: { type: "boolean" },
            bankruptcy_only: { type: "boolean" },
            exact_name: { type: "boolean" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            page: { type: "integer", minimum: 1 }
          },
          additionalProperties: false
        }
      },
      run: async (args) => searchEntities(client, searchSchema.parse(args)),
      summarize: (result) => {
        const parsed = result as { total: number; entities: unknown[] };
        return `${parsed.total} entities matched (returned ${parsed.entities.length}).`;
      }
    },
    {
      tool: {
        name: "get_entity_details",
        description: "Get entity details from danepodmiotu with unmasked board members.",
        inputSchema: {
          type: "object",
          properties: { krs: { type: "string" } },
          required: ["krs"],
          additionalProperties: false
        }
      },
      run: async (args) => getEntityDetails(client, getKrsSchema.parse(args).krs),
      summarize: (result) => {
        const parsed = result as { name: string; boardMembers: unknown[] };
        return `Fetched details for ${parsed.name} (${parsed.boardMembers.length} board members).`;
      }
    },
    {
      tool: {
        name: "get_entity_extract",
        description: "Get official current or full extract from KRS API.",
        inputSchema: {
          type: "object",
          properties: {
            krs: { type: "string" },
            register: { type: "string", enum: ["P", "S"] },
            type: { type: "string", enum: ["current", "full"] }
          },
          required: ["krs"],
          additionalProperties: false
        }
      },
      run: async (args) => {
        const parsed = extractSchema.parse(args);
        return getEntityExtract(client, parsed.krs, {
          register: parsed.register,
          type: parsed.type
        });
      },
      summarize: (result) => {
        const parsed = result as { krs: string; type: string };
        return `Fetched ${parsed.type} extract for KRS ${parsed.krs}.`;
      }
    },
    {
      tool: {
        name: "get_entity_board",
        description: "Get clean board view for a KRS entity.",
        inputSchema: {
          type: "object",
          properties: { krs: { type: "string" } },
          required: ["krs"],
          additionalProperties: false
        }
      },
      run: async (args) => getEntityBoard(client, getKrsSchema.parse(args).krs),
      summarize: (result) => {
        const parsed = result as { entityName: string; members: unknown[] };
        return `Board for ${parsed.entityName}: ${parsed.members.length} members.`;
      }
    },
    {
      tool: {
        name: "get_registry_changes",
        description: "List KRS numbers changed on a given day or hour range.",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            hour_from: { type: "integer", minimum: 0, maximum: 23 },
            hour_to: { type: "integer", minimum: 0, maximum: 23 }
          },
          required: ["date"],
          additionalProperties: false
        }
      },
      run: async (args) => {
        const parsed = changesSchema.parse(args);
        return getRegistryChanges(client, parsed.date, {
          hourFrom: parsed.hour_from,
          hourTo: parsed.hour_to
        });
      },
      summarize: (result) => {
        const parsed = result as { count: number; date: string };
        return `${parsed.count} unique KRS numbers changed on ${parsed.date}.`;
      }
    },
    {
      tool: {
        name: "registry_stats",
        description: "Return only total count for a search filter set.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            nip: { type: "string" },
            regon: { type: "string" },
            krs: { type: "string" },
            register: { type: "string", enum: ["P", "S", "both"] },
            city: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" },
            voivodeship: { type: "string" },
            opp_only: { type: "boolean" },
            bankruptcy_only: { type: "boolean" },
            exact_name: { type: "boolean" }
          },
          additionalProperties: false
        }
      },
      run: async (args) => getRegistryStats(client, searchSchema.partial().parse(args)),
      summarize: (result) => {
        const parsed = result as { total: number };
        return `Total entities matching filters: ${parsed.total}.`;
      }
    },
    {
      tool: {
        name: "get_debtor_details",
        description: "Fetch debtor details from danerdn endpoint.",
        inputSchema: {
          type: "object",
          properties: { rdn: { type: "string" } },
          required: ["rdn"],
          additionalProperties: false
        }
      },
      run: async (args) => getDebtorDetails(client, getRdnSchema.parse(args).rdn),
      summarize: (result) => {
        const parsed = result as { rdn: string; name: string | null };
        return `Fetched debtor details for RDN ${parsed.rdn}${parsed.name ? ` (${parsed.name})` : ""}.`;
      }
    },
    {
      tool: {
        name: "list_voivodeships",
        description: "List voivodeships from KRS TERYT basic endpoint.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          additionalProperties: false
        }
      },
      run: async (args) => listVoivodeships(client, voivodeshipsSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} voivodeships.`
    },
    {
      tool: {
        name: "list_counties",
        description: "List counties for a voivodeship.",
        inputSchema: {
          type: "object",
          properties: {
            voivodeship: { type: "string" },
            county: { type: "string" }
          },
          required: ["voivodeship"],
          additionalProperties: false
        }
      },
      run: async (args) => listCounties(client, countiesSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} counties.`
    },
    {
      tool: {
        name: "list_municipalities",
        description: "List municipalities for voivodeship+county.",
        inputSchema: {
          type: "object",
          properties: {
            voivodeship: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" }
          },
          required: ["voivodeship", "county"],
          additionalProperties: false
        }
      },
      run: async (args) => listMunicipalities(client, municipalitiesSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} municipalities.`
    },
    {
      tool: {
        name: "list_localities",
        description: "List localities for voivodeship+county+municipality.",
        inputSchema: {
          type: "object",
          properties: {
            voivodeship: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" },
            locality: { type: "string" }
          },
          required: ["voivodeship", "county", "municipality"],
          additionalProperties: false
        }
      },
      run: async (args) => listLocalities(client, localitiesSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} localities.`
    },
    {
      tool: {
        name: "suggest_cities",
        description: "Suggest cities from advanced TERYT endpoint.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            voivodeship: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" }
          },
          required: ["query"],
          additionalProperties: false
        }
      },
      run: async (args) => suggestCities(client, suggestCitiesSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} city suggestions.`
    },
    {
      tool: {
        name: "suggest_streets",
        description: "Suggest streets from advanced TERYT endpoint.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            voivodeship: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" },
            locality: { type: "string" }
          },
          required: ["query"],
          additionalProperties: false
        }
      },
      run: async (args) => suggestStreets(client, suggestStreetsSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} street suggestions.`
    },
    {
      tool: {
        name: "suggest_postal_codes",
        description: "Suggest postal codes from advanced TERYT endpoint.",
        inputSchema: {
          type: "object",
          properties: {
            locality: { type: "string" },
            street: { type: "string" }
          },
          required: ["locality"],
          additionalProperties: false
        }
      },
      run: async (args) => suggestPostalCodes(client, suggestPostalCodesSchema.parse(args)),
      summarize: (result) => `Returned ${(result as unknown[]).length} postal-code suggestions.`
    },
    {
      tool: {
        name: "lookup_admin_by_city",
        description: "Lookup administrative hierarchy by city name.",
        inputSchema: {
          type: "object",
          properties: { city: { type: "string" } },
          required: ["city"],
          additionalProperties: false
        }
      },
      run: async (args) => lookupAdminByCity(client, lookupByCitySchema.parse(args).city),
      summarize: (result) => {
        const parsed = result as { city: string };
        return `Fetched administrative lookup for city ${parsed.city}.`;
      }
    },
    {
      tool: {
        name: "validate_address",
        description: "Validate address candidate via advanced TERYT endpoint.",
        inputSchema: {
          type: "object",
          properties: {
            voivodeship: { type: "string" },
            county: { type: "string" },
            municipality: { type: "string" },
            locality: { type: "string" },
            street: { type: "string" },
            houseNumber: { type: "string" },
            apartmentNumber: { type: "string" },
            postalCode: { type: "string" }
          },
          additionalProperties: true
        }
      },
      run: async (args) => validateAddress(client, validateAddressSchema.parse(args)),
      summarize: (result) => {
        const parsed = result as { valid: boolean | null };
        return parsed.valid === null
          ? "Address validation response received."
          : `Address validation result: ${parsed.valid ? "valid" : "invalid"}.`;
      }
    }
  ];
}
