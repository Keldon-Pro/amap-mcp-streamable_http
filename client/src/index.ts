/// <reference types="node" />
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";


const MCP_SERVER_URL = "http://localhost:3000/mcp"; //无状态MCP Server URL
// const MCP_SERVER_URL = "http://localhost:3001/mcp"; //有状态MCP Server URL

async function main() {
  // 创建 MCP Client 实例
  const client = new Client({ name: "amap-maps-mcp-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  await client.connect(transport);

  // 1. 列出所有工具
  const tools = await client.listTools();
  // console.log("可用工具：", tools.tools.map(t => t.name));
  // 修改输出格式为JSON字符串，便于Python解析
  console.log("可用工具：" + JSON.stringify(tools.tools.map(t => t.name)));

  // 2. 示例：调用地理编码工具
  try {
    const result = await client.callTool({
      name: "geo",
      arguments: { address: "云南省昆明市五华区翠湖公园", city: "昆明" }
    });
    console.log("client正常工作");
  } catch (error) {
    console.error("调用工具失败:", error);
  }
}

main().catch(err => {
  console.error("MCP Client 运行出错：", err);
});