import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  createDeckTool,
  getDeckTool,
  updateDeckTool,
  deleteDeckTool,
  uploadImageTool,
  listLayoutsTool,
} from './tools/index.js';

const server = new McpServer({
  name: 'deckpipe',
  version: '0.1.0',
});

// Register tools
const tools = [createDeckTool, getDeckTool, updateDeckTool, deleteDeckTool, uploadImageTool, listLayoutsTool];

for (const tool of tools) {
  server.tool(
    tool.name,
    tool.description,
    {}, // MCP SDK handles schema validation, we pass empty and let the tool handle it
    async (args: Record<string, unknown>) => {
      return await tool.execute(args);
    }
  );
}

// Start with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Deckpipe MCP server running on stdio');
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
