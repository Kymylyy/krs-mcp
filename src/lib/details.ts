import { encryptKrs } from "./crypto.js";
import { asArray, asBooleanOrNull, asRecord, asStringOrNull, normalizeKrs } from "./normalize.js";
import type { BoardMember, EntityDetails, KrsClient } from "./types.js";
import { z } from "zod";

interface DetailsMemberRecord {
  funkcja?: unknown;
  imiePierwsze?: unknown;
  imieDrugie?: unknown;
  nazwisko?: unknown;
  nazwiskoDrugiCzlon?: unknown;
  nazwa?: unknown;
  [key: string]: unknown;
}

const detailsMemberSchema = z
  .object({
    funkcja: z.unknown().optional(),
    imiePierwsze: z.unknown().optional(),
    imieDrugie: z.unknown().optional(),
    nazwisko: z.unknown().optional(),
    nazwiskoDrugiCzlon: z.unknown().optional(),
    nazwa: z.unknown().optional()
  })
  .passthrough();

const detailsResponseSchema = z
  .object({
    numerKRS: z.unknown().optional(),
    nazwa: z.unknown().optional(),
    formaPrawna: z.unknown().optional(),
    nip: z.unknown().optional(),
    regon: z.unknown().optional(),
    adres: z.unknown().optional(),
    adresWWW: z.unknown().optional(),
    email: z.unknown().optional(),
    wojewodztwo: z.unknown().optional(),
    powiat: z.unknown().optional(),
    gmina: z.unknown().optional(),
    miejscowosc: z.unknown().optional(),
    kodPocztowy: z.unknown().optional(),
    nazwaOrganuRep: z.unknown().optional(),
    sposobRep: z.unknown().optional(),
    listaCzlonkowReprezentacji: z.array(detailsMemberSchema).optional(),
    czyOPP: z.unknown().optional(),
    czyUpadlosc: z.unknown().optional(),
    daneDotyczaceUpadlosci: z.unknown().optional()
  })
  .passthrough();
type DetailsResponse = z.infer<typeof detailsResponseSchema>;

function mapBoardMember(item: DetailsMemberRecord): BoardMember {
  const corporateName = asStringOrNull(item.nazwa);
  const rawLastName = asStringOrNull(item.nazwisko);

  return {
    function: asStringOrNull(item.funkcja) ?? "",
    firstName: asStringOrNull(item.imiePierwsze),
    middleName: asStringOrNull(item.imieDrugie),
    lastName: corporateName ? corporateName : rawLastName,
    secondLastName: asStringOrNull(item.nazwiskoDrugiCzlon),
    corporateName,
    raw: item
  };
}

export async function getEntityDetails(client: KrsClient, krs: string): Promise<EntityDetails> {
  const normalizedKrs = normalizeKrs(krs);
  const encryptedKrs = encryptKrs(normalizedKrs, client.config.secretKey);

  const rawResponse = await client.wyszukiwarkaPost<unknown>(
    "danepodmiotu",
    { krs: encryptedKrs },
    { retry401: true }
  );
  const response: DetailsResponse = detailsResponseSchema.parse(rawResponse);

  const members = asArray<DetailsMemberRecord>(response.listaCzlonkowReprezentacji).map(
    mapBoardMember
  );

  return {
    krs: asStringOrNull(response.numerKRS) ?? normalizedKrs,
    name: asStringOrNull(response.nazwa) ?? "",
    legalForm: asStringOrNull(response.formaPrawna),
    nip: asStringOrNull(response.nip),
    regon: asStringOrNull(response.regon),
    address: asStringOrNull(response.adres),
    website: asStringOrNull(response.adresWWW),
    email: asStringOrNull(response.email),
    voivodeship: asStringOrNull(response.wojewodztwo),
    county: asStringOrNull(response.powiat),
    municipality: asStringOrNull(response.gmina),
    locality: asStringOrNull(response.miejscowosc),
    postalCode: asStringOrNull(response.kodPocztowy),
    representationBody: asStringOrNull(response.nazwaOrganuRep),
    representationRules: asStringOrNull(response.sposobRep),
    boardMembers: members,
    isOpp: asBooleanOrNull(response.czyOPP),
    isBankrupt: asBooleanOrNull(response.czyUpadlosc),
    bankruptcyDetails: response.daneDotyczaceUpadlosci
      ? asRecord(response.daneDotyczaceUpadlosci)
      : null,
    raw: asRecord(response)
  };
}
