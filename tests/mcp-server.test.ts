import { describe, expect, it } from "vitest";
import { createMcpServer } from "../src/mcp/server.js";

describe("mcp server", () => {
  it("creates server instance", () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });
});
