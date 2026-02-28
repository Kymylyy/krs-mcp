import { encryptKrs } from "./crypto.js";
import { asArray, asBooleanOrNull, asRecord, asStringOrNull, normalizeKrs } from "./normalize.js";
import type { BoardMember, EntityDetails, KrsClient } from "./types.js";

interface DetailsMemberRecord {
  funkcja?: unknown;
  imiePierwsze?: unknown;
  imieDrugie?: unknown;
  nazwisko?: unknown;
  nazwiskoDrugiCzlon?: unknown;
  nazwa?: unknown;
  [key: string]: unknown;
}

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
  } as BoardMember;
}

export async function getEntityDetails(client: KrsClient, krs: string): Promise<EntityDetails> {
  const normalizedKrs = normalizeKrs(krs);
  const encryptedKrs = encryptKrs(normalizedKrs, client.config.secretKey);

  const response = await client.wyszukiwarkaPost<Record<string, unknown>>(
    "danepodmiotu",
    { krs: encryptedKrs },
    { retry401: true }
  );

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
    raw: response
  };
}
