#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";
import type { KrsConfig } from "../lib/types.js";

function parseNumberEnv(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function loadConfigFromEnv(): Partial<KrsConfig> {
  return {
    officialApiBaseUrl: process.env.KRS_OFFICIAL_API_BASE_URL,
    wyszukiwarkaBaseUrl: process.env.KRS_WYSZUKIWARKA_BASE_URL,
    terytAdvancedBaseUrl: process.env.KRS_TERYT_ADVANCED_BASE_URL,
    apiKeyHeader: process.env.KRS_API_KEY_HEADER,
    secretKey: process.env.KRS_SECRET_KEY,
    timeoutMs: parseNumberEnv(process.env.KRS_TIMEOUT_MS),
    rateLimitPerSecond: parseNumberEnv(process.env.KRS_RATE_LIMIT_PER_SECOND)
  };
}

async function main(): Promise<void> {
  const server = createMcpServer(loadConfigFromEnv());
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`Failed to start krs-mcp server: ${message}`);
  process.exit(1);
});
