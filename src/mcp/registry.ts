import { z } from "zod";
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
  changesToolSchema,
  countiesToolSchema,
  extractToolSchema,
  getKrsToolSchema,
  getRdnToolSchema,
  localitiesToolSchema,
  lookupByCityToolSchema,
  municipalitiesToolSchema,
  registryStatsToolSchema,
  searchToolSchema,
  suggestCitiesToolSchema,
  suggestPostalCodesToolSchema,
  suggestStreetsToolSchema,
  validateAddressToolSchema,
  voivodeshipsToolSchema,
  type McpToolSchema
} from "./schemas.js";
import type { RegisteredTool } from "./types.js";

function defineTool<T extends z.ZodTypeAny>(options: {
  name: string;
  description: string;
  schema: McpToolSchema<T>;
  run: (input: z.infer<T>) => Promise<unknown>;
  summarize: (result: unknown) => string;
}): RegisteredTool {
  return {
    tool: {
      name: options.name,
      description: options.description,
      inputSchema: options.schema.inputSchema
    },
    run: async (args) => options.run(options.schema.parser.parse(args)),
    summarize: options.summarize
  };
}

export function createRegisteredTools(client: KrsClient): RegisteredTool[] {
  return [
    defineTool({
      name: "search_entities",
      description: "Search entities in KRS by identifiers, name or location.",
      schema: searchToolSchema,
      run: async (input) => searchEntities(client, input),
      summarize: (result) => {
        const parsed = result as { total: number; entities: unknown[] };
        return `${parsed.total} entities matched (returned ${parsed.entities.length}).`;
      }
    }),

    defineTool({
      name: "get_entity_details",
      description: "Get entity details from danepodmiotu with unmasked board members.",
      schema: getKrsToolSchema,
      run: async (input) => getEntityDetails(client, input.krs),
      summarize: (result) => {
        const parsed = result as { name: string; boardMembers: unknown[] };
        return `Fetched details for ${parsed.name} (${parsed.boardMembers.length} board members).`;
      }
    }),

    defineTool({
      name: "get_entity_extract",
      description: "Get official current or full extract from KRS API.",
      schema: extractToolSchema,
      run: async (input) =>
        getEntityExtract(client, input.krs, {
          register: input.register,
          type: input.type
        }),
      summarize: (result) => {
        const parsed = result as { krs: string; type: string };
        return `Fetched ${parsed.type} extract for KRS ${parsed.krs}.`;
      }
    }),

    defineTool({
      name: "get_entity_board",
      description: "Get clean board view for a KRS entity.",
      schema: getKrsToolSchema,
      run: async (input) => getEntityBoard(client, input.krs),
      summarize: (result) => {
        const parsed = result as { entityName: string; members: unknown[] };
        return `Board for ${parsed.entityName}: ${parsed.members.length} members.`;
      }
    }),

    defineTool({
      name: "get_registry_changes",
      description: "List KRS numbers changed on a given day or hour range.",
      schema: changesToolSchema,
      run: async (input) =>
        getRegistryChanges(client, input.date, {
          hourFrom: input.hour_from,
          hourTo: input.hour_to
        }),
      summarize: (result) => {
        const parsed = result as { count: number; date: string };
        return `${parsed.count} unique KRS numbers changed on ${parsed.date}.`;
      }
    }),

    defineTool({
      name: "registry_stats",
      description: "Return only total count for a search filter set.",
      schema: registryStatsToolSchema,
      run: async (input) => getRegistryStats(client, input),
      summarize: (result) => {
        const parsed = result as { total: number };
        return `Total entities matching filters: ${parsed.total}.`;
      }
    }),

    defineTool({
      name: "get_debtor_details",
      description: "Fetch debtor details from danerdn endpoint.",
      schema: getRdnToolSchema,
      run: async (input) => getDebtorDetails(client, input.rdn),
      summarize: (result) => {
        const parsed = result as { rdn: string; name: string | null };
        return `Fetched debtor details for RDN ${parsed.rdn}${parsed.name ? ` (${parsed.name})` : ""}.`;
      }
    }),

    defineTool({
      name: "list_voivodeships",
      description: "List voivodeships from KRS TERYT basic endpoint.",
      schema: voivodeshipsToolSchema,
      run: async (input) => listVoivodeships(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} voivodeships.`
    }),

    defineTool({
      name: "list_counties",
      description: "List counties for a voivodeship.",
      schema: countiesToolSchema,
      run: async (input) => listCounties(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} counties.`
    }),

    defineTool({
      name: "list_municipalities",
      description: "List municipalities for voivodeship+county.",
      schema: municipalitiesToolSchema,
      run: async (input) => listMunicipalities(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} municipalities.`
    }),

    defineTool({
      name: "list_localities",
      description: "List localities for voivodeship+county+municipality.",
      schema: localitiesToolSchema,
      run: async (input) => listLocalities(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} localities.`
    }),

    defineTool({
      name: "suggest_cities",
      description: "Suggest cities from advanced TERYT endpoint.",
      schema: suggestCitiesToolSchema,
      run: async (input) => suggestCities(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} city suggestions.`
    }),

    defineTool({
      name: "suggest_streets",
      description: "Suggest streets from advanced TERYT endpoint.",
      schema: suggestStreetsToolSchema,
      run: async (input) => suggestStreets(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} street suggestions.`
    }),

    defineTool({
      name: "suggest_postal_codes",
      description: "Suggest postal codes from advanced TERYT endpoint.",
      schema: suggestPostalCodesToolSchema,
      run: async (input) => suggestPostalCodes(client, input),
      summarize: (result) => `Returned ${(result as unknown[]).length} postal-code suggestions.`
    }),

    defineTool({
      name: "lookup_admin_by_city",
      description: "Lookup administrative hierarchy by city name.",
      schema: lookupByCityToolSchema,
      run: async (input) => lookupAdminByCity(client, input.city),
      summarize: (result) => {
        const parsed = result as { city: string };
        return `Fetched administrative lookup for city ${parsed.city}.`;
      }
    }),

    defineTool({
      name: "validate_address",
      description: "Validate address candidate via advanced TERYT endpoint.",
      schema: validateAddressToolSchema,
      run: async (input) => validateAddress(client, input),
      summarize: (result) => {
        const parsed = result as { valid: boolean | null };
        return parsed.valid === null
          ? "Address validation response received."
          : `Address validation result: ${parsed.valid ? "valid" : "invalid"}.`;
      }
    })
  ];
}
