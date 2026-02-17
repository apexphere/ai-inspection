import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

const server = new McpServer({
  name: "ai-inspection",
  version: "0.1.0",
});

// Register all tools
registerTools(server);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Inspection MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
