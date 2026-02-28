export type ToolExecutor = (args: unknown) => Promise<unknown>;
export type ToolSummary = (result: unknown) => string;

export interface RegisteredTool {
  tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
  run: ToolExecutor;
  summarize: ToolSummary;
}
