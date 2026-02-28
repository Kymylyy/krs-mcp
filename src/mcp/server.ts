import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";
import { createKrsClient, formatErrorMessage } from "../lib/index.js";
import type { KrsConfig } from "../lib/types.js";
import { createRegisteredTools } from "./registry.js";

function toolSuccess(summary: string, payload: unknown): CallToolResult {
  return {
    content: [
      { type: "text", text: summary },
      { type: "text", text: JSON.stringify(payload, null, 2) }
    ]
  };
}

function toolError(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }]
  };
}

export function createMcpServer(config: Partial<KrsConfig> = {}): Server {
  const client = createKrsClient(config);
  const registeredTools = createRegisteredTools(client);
  const toolMap = new Map(registeredTools.map((entry) => [entry.tool.name, entry]));

  const server = new Server(
    {
      name: "krs-mcp",
      version: "0.1.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: registeredTools.map((entry) => entry.tool) as Tool[]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const selected = toolMap.get(request.params.name);
    if (!selected) {
      return toolError(`Unknown tool: ${request.params.name}`);
    }

    try {
      const payload = await selected.run(request.params.arguments);
      const summary = selected.summarize(payload);
      return toolSuccess(summary, payload);
    } catch (error) {
      return toolError(formatErrorMessage(error));
    }
  });

  return server;
}
