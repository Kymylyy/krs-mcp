import { getEntityDetails } from "./details.js";
import type { BoardResult, KrsClient } from "./types.js";

export async function getEntityBoard(client: KrsClient, krs: string): Promise<BoardResult> {
  const details = await getEntityDetails(client, krs);

  return {
    krs: details.krs,
    entityName: details.name,
    representationBody: details.representationBody,
    representationRules: details.representationRules,
    members: details.boardMembers
  };
}
