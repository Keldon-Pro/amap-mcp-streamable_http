/// <reference types="node" />
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// 支持 Node 环境变量
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000/mcp";

// 测试地点坐标
const Position_A = "110.312028,20.055884"; //华彩.海口湾广场
const Position_B = "110.237390,20.036904"; //假日海滩

/**
 * 工具调用结果类型
 */
interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * 测试所有工具
 */
async function runAllTests() {
  // 创建 MCP Client 实例
  const client = new Client({ name: "amap-maps-mcp-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  await client.connect(transport);

  // 列出所有工具
  const tools = await client.listTools();
  console.log("可用工具：", tools.tools.map(t => t.name));

  try {
    // 1. 测试地理编码
    console.log("\n=== 测试地理编码 (geo) ===");
    const geoResult = await client.callTool({
      name: "geo",
      arguments: { 
        address: "海南省海口市美兰区海口湾广场",
        city: "海口" 
      }
    }) as ToolResult;
    console.log("地理编码结果：", geoResult);

    // 2. 测试逆地理编码
    console.log("\n=== 测试逆地理编码 (regeocode) ===");
    const regeoResult = await client.callTool({
      name: "regeocode",
      arguments: { 
        location: Position_A,
        extensions: "all"
      }
    }) as ToolResult;
    console.log("逆地理编码结果：", regeoResult);

    // 3. 测试驾车路径规划
    console.log("\n=== 测试驾车路径规划 (direction_driving) ===");
    const drivingResult = await client.callTool({
      name: "direction_driving",
      arguments: { 
        origin: Position_A,
        destination: Position_B,
        strategy: 0
      }
    }) as ToolResult;
    console.log("驾车路径规划结果：", drivingResult);

    // 4. 测试步行路径规划
    console.log("\n=== 测试步行路径规划 (direction_walking) ===");
    const walkingResult = await client.callTool({
      name: "direction_walking",
      arguments: { 
        origin: Position_A,
        destination: Position_B
      }
    }) as ToolResult;
    console.log("步行路径规划结果：", walkingResult);

    // 5. 测试公交路径规划
    console.log("\n=== 测试公交路径规划 (direction_transit_integrated) ===");
    const transitResult = await client.callTool({
      name: "direction_transit_integrated",
      arguments: { 
        origin: Position_A,
        destination: Position_B,
        city: "海口",
        strategy: 0
      }
    }) as ToolResult;
    console.log("公交路径规划结果：", transitResult);

    // 6. 测试骑行路径规划
    console.log("\n=== 测试骑行路径规划 (bicycling) ===");
    const bicyclingResult = await client.callTool({
      name: "bicycling",
      arguments: { 
        origin: Position_A,
        destination: Position_B
      }
    }) as ToolResult;
    console.log("骑行路径规划结果：", bicyclingResult);

    // 7. 测试关键词搜索POI
    console.log("\n=== 测试关键词搜索POI (text_search) ===");
    const textSearchResult = await client.callTool({
      name: "text_search",
      arguments: { 
        keywords: "海口湾广场",
        city: "海口",
        offset: 5,
        page: 1
      }
    }) as ToolResult;
    console.log("关键词搜索POI结果：", textSearchResult);

    // 8. 测试周边搜索
    console.log("\n=== 测试周边搜索 (around_search) ===");
    const aroundSearchResult = await client.callTool({
      name: "around_search",
      arguments: { 
        location: Position_A,
        keywords: "餐厅",
        radius: 1000,
        offset: 5,
        page: 1
      }
    }) as ToolResult;
    console.log("周边搜索结果：", aroundSearchResult);

    // 9. 测试POI详情
    console.log("\n=== 测试POI详情 (search_detail) ===");
    // 假设我们已经知道一个POI的ID，这里需要替换成实际的ID
    // 可以先通过text_search获取ID
    if (textSearchResult.content && textSearchResult.content[0] && textSearchResult.content[0].text) {
      const poiResult = JSON.parse(textSearchResult.content[0].text);
      let poiId = "";
      if (poiResult.status === "1" && poiResult.pois && poiResult.pois.length > 0) {
        poiId = poiResult.pois[0].id;
        const detailResult = await client.callTool({
          name: "search_detail",
          arguments: { 
            id: poiId
          }
        }) as ToolResult;
        console.log("POI详情结果：", detailResult);
      } else {
        console.log("未找到POI，跳过详情测试");
      }
    } else {
      console.log("关键词搜索结果无效，跳过POI详情测试");
    }

    // 10. 测试天气查询
    console.log("\n=== 测试天气查询 (weather) ===");
    const weatherResult = await client.callTool({
      name: "weather",
      arguments: { 
        city: "海口"
      }
    }) as ToolResult;
    console.log("天气查询结果：", weatherResult);

    // 11. 测试距离测量
    console.log("\n=== 测试距离测量 (distance) ===");
    const distanceResult = await client.callTool({
      name: "distance",
      arguments: { 
        origins: Position_A,
        destination: Position_B,
        type: "1" // 驾车导航距离
      }
    }) as ToolResult;
    console.log("距离测量结果：", distanceResult);

    // 12. 测试IP定位
    console.log("\n=== 测试IP定位 (ip_location) ===");
    const ipLocationResult = await client.callTool({
      name: "ip_location",
      arguments: { 
        // 不传入ip参数，使用当前请求的IP
      }
    }) as ToolResult;
    console.log("IP定位结果：", ipLocationResult);

  } catch (error) {
    console.error("测试出错:", error);
  }
}

runAllTests().catch(err => {
  console.error("MCP 测试运行出错：", err);
}); 