export type RegisterType = "P" | "S";
export type RegisterInput = RegisterType | "both";

export interface KrsConfig {
  officialApiBaseUrl: string;
  wyszukiwarkaBaseUrl: string;
  terytAdvancedBaseUrl: string;
  apiKeyHeader: string;
  secretKey: string;
  timeoutMs: number;
  rateLimitPerSecond: number;
  fetchImpl: typeof fetch;
}

export interface RetryOptions {
  retry401?: boolean;
}

export interface KrsClient {
  readonly config: KrsConfig;
  officialApiGet<T>(path: string): Promise<T>;
  wyszukiwarkaPost<T>(path: string, body: object, retryOptions?: RetryOptions): Promise<T>;
  terytBasicPost<T>(path: string, body: object, retryOptions?: RetryOptions): Promise<T>;
  terytAdvancedGet<T>(path: string, params?: Record<string, string>): Promise<T>;
  terytAdvancedPost<T>(path: string, body: object): Promise<T>;
}

export interface SearchOptions {
  name?: string;
  nip?: string;
  regon?: string;
  krs?: string;
  register?: RegisterInput;
  city?: string;
  county?: string;
  municipality?: string;
  voivodeship?: string;
  opp_only?: boolean;
  bankruptcy_only?: boolean;
  exact_name?: boolean;
  limit?: number;
  page?: number;
}

export interface SearchEntity {
  krs: string;
  name: string;
  city: string | null;
  register: RegisterType;
  opp: boolean;
  bankruptcy: boolean;
  raw: Record<string, unknown>;
}

export interface SearchResult {
  total: number;
  page: number;
  limit: number;
  entities: SearchEntity[];
}

export interface BoardMember {
  function: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  secondLastName: string | null;
  corporateName: string | null;
  raw?: Record<string, unknown>;
}

export interface EntityDetails {
  krs: string;
  name: string;
  legalForm: string | null;
  nip: string | null;
  regon: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  voivodeship: string | null;
  county: string | null;
  municipality: string | null;
  locality: string | null;
  postalCode: string | null;
  representationBody: string | null;
  representationRules: string | null;
  boardMembers: BoardMember[];
  isOpp: boolean | null;
  isBankrupt: boolean | null;
  bankruptcyDetails: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

export interface BoardResult {
  krs: string;
  entityName: string;
  representationBody: string | null;
  representationRules: string | null;
  members: BoardMember[];
}

export interface EntityExtractOptions {
  register?: RegisterType;
  type?: "current" | "full";
}

export interface EntityExtractResult {
  krs: string;
  register: RegisterType | null;
  type: "current" | "full";
  data: Record<string, unknown>;
}

export interface RegistryChangesOptions {
  hourFrom?: number;
  hourTo?: number;
}

export interface RegistryChangesResult {
  date: string;
  hourFrom: number | null;
  hourTo: number | null;
  count: number;
  krsNumbers: string[];
  rawCount: number;
}

export interface DebtorDetails {
  rdn: string;
  krs: string | null;
  name: string | null;
  raw: Record<string, unknown>;
}

export interface TerytItem {
  name: string;
  teryt: boolean;
  raw: Record<string, unknown>;
}

export interface TerytBasicOptions {
  voivodeship?: string;
  county?: string;
  municipality?: string;
  locality?: string;
}

export interface TerytSuggestion {
  label: string;
  highlight: boolean;
  raw: Record<string, unknown>;
}

export interface SuggestCitiesOptions {
  query: string;
  voivodeship?: string;
  county?: string;
  municipality?: string;
}

export interface SuggestStreetsOptions {
  query: string;
  voivodeship?: string;
  county?: string;
  municipality?: string;
  locality?: string;
}

export interface SuggestPostalCodesOptions {
  locality: string;
  street?: string;
}

export interface AdminByCityResult {
  city: string;
  raw: unknown;
}

export interface AddressValidationInput {
  voivodeship?: string;
  county?: string;
  municipality?: string;
  locality?: string;
  street?: string;
  houseNumber?: string;
  apartmentNumber?: string;
  postalCode?: string;
  [key: string]: unknown;
}

export interface AddressValidationResult {
  valid: boolean | null;
  raw: unknown;
}
