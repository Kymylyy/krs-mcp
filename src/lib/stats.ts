import { searchEntities } from "./search.js";
import type { KrsClient, SearchOptions } from "./types.js";

export async function getRegistryStats(
  client: KrsClient,
  options: SearchOptions
): Promise<{ total: number }> {
  const result = await searchEntities(client, {
    ...options,
    limit: 1,
    page: 1
  });

  return { total: result.total };
}
