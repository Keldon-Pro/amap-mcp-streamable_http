import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import path from 'path';
import fs from 'fs';

// MCP server 地址
const MCP_SERVER_URL = "http://localhost:3000/mcp";

// 日志写入函数
function writeToLog(toolName, data) {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const logFileName = `stateless_test.log`;
  const logPath = path.join(logDir, logFileName);
  const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
  let logContent = data;
  // 尝试自动解析content[0].text为JSON
  if (data && data.content && Array.isArray(data.content) && data.content[0]?.type === 'text') {
    try {
      logContent = JSON.parse(data.content[0].text);
    } catch {
      logContent = data;
    }
  }
  const logEntry = `\n\n--- ${timestamp} - ${toolName} ---\n${JSON.stringify(logContent, null, 2)}`;
  fs.appendFileSync(logPath, logEntry);
  console.log(`详细信息已保存到日志: ${logPath}`);
}

async function testStatelessServer() {
  console.log("测试无状态服务器...");
  console.log(`连接到服务器: ${MCP_SERVER_URL}`);

  try {
    const client = new Client({ name: "amap-maps-mcp-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
    await client.connect(transport);
    console.log('连接成功');

    // 获取工具列表
    const toolsResult = await client.listTools();
    console.log(`找到 ${toolsResult.tools?.length || 0} 个工具`);
    if (toolsResult.tools && toolsResult.tools.length > 0) {
      toolsResult.tools.forEach(tool => {
        console.log(`- ${tool.name}`);
      });
    }

    // geo
    console.log("\n测试地理编码工具 (geo)...");
    const geoResult = await client.callTool({
      name: "geo",
      arguments: { address: "海南省海口市美兰区华彩·海口湾广场", city: "海口" }
    });
    writeToLog('geo', geoResult);
    if (geoResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(geoResult.content[0].text);
        if (data.status === "1" && data.geocodes?.length > 0) {
          console.log(`地址: ${data.geocodes[0].formatted_address}`);
          console.log(`坐标: ${data.geocodes[0].location}`);
        } else {
          console.log("地理编码失败:", data);
        }
      } catch (err) {
        console.log("解析地理编码结果失败:", err);
      }
    }

    // regeocode
    console.log("\n测试逆地理编码工具 (regeocode)...");
    const regeoResult = await client.callTool({
      name: "regeocode",
      arguments: { location: "110.312589,20.055793" }
    });
    writeToLog('regeocode', regeoResult);
    if (regeoResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(regeoResult.content[0].text);
        if (data.status === "1" && data.regeocode) {
          console.log(`地址: ${data.regeocode.formatted_address}`);
        } else {
          console.log("逆地理编码失败:", data);
        }
      } catch (err) {
        console.log("解析逆地理编码结果失败:", err);
      }
    }

    // direction_driving
    console.log("\n测试驾车路径规划工具 (direction_driving)...");
    const drivingResult = await client.callTool({
      name: "direction_driving",
      arguments: { origin: "110.312589,20.055793", destination: "110.330162,20.022889" }
    });
    writeToLog('direction_driving', drivingResult);
    if (drivingResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(drivingResult.content[0].text);
        if (data.status === "1" && data.route?.paths?.length > 0) {
          const path = data.route.paths[0];
          console.log(`驾车距离: ${path.distance}米`);
          console.log(`预计时间: ${path.duration}秒`);
        } else {
          console.log("驾车路径规划失败:", data);
        }
      } catch (err) {
        console.log("解析驾车路径规划结果失败:", err);
      }
    }

    // direction_walking
    console.log("\n测试步行路径规划工具 (direction_walking)...");
    const walkingResult = await client.callTool({
      name: "direction_walking",
      arguments: { origin: "110.312589,20.055793", destination: "110.330162,20.022889" }
    });
    writeToLog('direction_walking', walkingResult);
    if (walkingResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(walkingResult.content[0].text);
        if (data.status === "1" && data.route?.paths?.length > 0) {
          const path = data.route.paths[0];
          console.log(`步行距离: ${path.distance}米`);
          console.log(`预计时间: ${path.duration}秒`);
        } else {
          console.log("步行路径规划失败:", data);
        }
      } catch (err) {
        console.log("解析步行路径规划结果失败:", err);
      }
    }

    // direction_transit_integrated
    console.log("\n测试公交路径规划工具 (direction_transit_integrated)...");
    const transitResult = await client.callTool({
      name: "direction_transit_integrated",
      arguments: { origin: "110.312589,20.055793", destination: "110.330162,20.022889", city: "海口", cityd: "海口" }
    });
    writeToLog('direction_transit_integrated', transitResult);
    if (transitResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(transitResult.content[0].text);
        if (data.status === "1" && data.route?.transits?.length > 0) {
          const transit = data.route.transits[0];
          console.log(`公交路线数量: ${data.route.transits.length}`);
          console.log(`第一条路线距离: ${transit.distance}米`);
          console.log(`预计时间: ${transit.duration}秒`);
        } else {
          console.log("公交路径规划失败:", data);
        }
      } catch (err) {
        console.log("解析公交路径规划结果失败:", err);
      }
    }

    // bicycling
    console.log("\n测试骑行路径规划工具 (bicycling)...");
    const bicyclingResult = await client.callTool({
      name: "bicycling",
      arguments: { origin: "110.312589,20.055793", destination: "110.330162,20.022889" }
    });
    writeToLog('bicycling', bicyclingResult);
    if (bicyclingResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(bicyclingResult.content[0].text);
        if ((data.errcode === 0 || data.status === "1") && data.data?.paths?.length > 0) {
          const path = data.data.paths[0];
          console.log(`骑行距离: ${path.distance || '未知'}米`);
          console.log(`预计时间: ${path.duration || '未知'}秒`);
          console.log(`骑行路段数: ${path.steps ? path.steps.length : '未知'}`);
        } else {
          console.log("骑行路径规划失败:", data);
        }
      } catch (err) {
        console.log("解析骑行路径规划结果失败:", err);
      }
    }

    // text_search
    console.log("\n测试关键字搜索工具 (text_search)...");
    const textSearchResult = await client.callTool({
      name: "text_search",
      arguments: { keywords: "咖啡", city: "海口" }
    });
    writeToLog('text_search', textSearchResult);
    if (textSearchResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(textSearchResult.content[0].text);
        if (data.status === "1" && data.pois?.length > 0) {
          console.log(`找到 ${data.pois.length} 个位置`);
          console.log(`第一个结果: ${data.pois[0].name}`);
          console.log(`地址: ${data.pois[0].address}`);
          console.log(`坐标: ${data.pois[0].location}`);
        } else {
          console.log("关键字搜索失败:", data);
        }
      } catch (err) {
        console.log("解析关键字搜索结果失败:", err);
      }
    }

    // around_search
    console.log("\n测试周边搜索工具 (around_search)...");
    const aroundSearchResult = await client.callTool({
      name: "around_search",
      arguments: { keywords: "餐厅", location: "110.312589,20.055793", radius: "1000" }
    });
    writeToLog('around_search', aroundSearchResult);
    let firstPoiId = null;
    if (aroundSearchResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(aroundSearchResult.content[0].text);
        if (data.status === "1" && data.pois?.length > 0) {
          console.log(`周边1公里找到 ${data.pois.length} 个餐厅`);
          console.log(`第一个结果: ${data.pois[0].name}`);
          console.log(`地址: ${data.pois[0].address || '未知'}`);
          console.log(`距离: ${data.pois[0].distance || '未知'}米`);
          firstPoiId = data.pois[0].id;
        } else {
          console.log("周边搜索失败:", data);
        }
      } catch (err) {
        console.log("解析周边搜索结果失败:", err);
      }
    }

    // search_detail
    if (firstPoiId) {
      console.log("\n测试POI详情查询工具 (search_detail)...");
      const detailResult = await client.callTool({
        name: "search_detail",
        arguments: { id: firstPoiId }
      });
      writeToLog('search_detail', detailResult);
      if (detailResult?.content?.[0]?.type === "text") {
        try {
          const data = JSON.parse(detailResult.content[0].text);
          if (data.status === "1" && data.pois?.length > 0) {
            const poi = data.pois[0];
            console.log(`名称: ${poi.name}`);
            console.log(`类型: ${poi.type}`);
            console.log(`电话: ${poi.tel || '未知'}`);
            console.log(`地址: ${poi.address || '未知'}`);
            console.log(`营业时间: ${poi.business_time || '未知'}`);
          } else {
            console.log("POI详情查询失败:", data);
          }
        } catch (err) {
          console.log("解析POI详情查询结果失败:", err);
        }
      }
    }

    // weather
    console.log("\n测试天气查询工具 (weather)...");
    const weatherResult = await client.callTool({
      name: "weather",
      arguments: { city: "海口" }
    });
    writeToLog('weather', weatherResult);
    if (weatherResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(weatherResult.content[0].text);
        if (data.status === "1" && data.forecasts?.length > 0) {
          console.log(`地区: ${data.forecasts[0].city}`);
          console.log(`预报时间: ${data.forecasts[0].reporttime}`);
          console.log("天气预报:");
          data.forecasts[0].casts?.slice(0, 2).forEach(cast => {
            console.log(`- ${cast.date}: 白天 ${cast.dayweather} ${cast.daytemp}°C, 夜间 ${cast.nightweather} ${cast.nighttemp}°C`);
          });
        } else {
          console.log("天气查询失败:", data);
        }
      } catch (err) {
        console.log("解析天气查询结果失败:", err);
      }
    }

    // distance
    console.log("\n测试距离测量工具 (distance)...");
    const distanceResult = await client.callTool({
      name: "distance",
      arguments: { origins: "110.312589,20.055793", destination: "110.330162,20.022889", type: "1" }
    });
    writeToLog('distance', distanceResult);
    if (distanceResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(distanceResult.content[0].text);
        if (data.status === "1" && data.results?.length > 0) {
          const result = data.results[0];
          console.log(`驾车距离: ${result.distance}米`);
          console.log(`预计时间: ${result.duration}秒`);
        } else {
          console.log("距离测量失败:", data);
        }
      } catch (err) {
        console.log("解析距离测量结果失败:", err);
      }
    }

    // ip_location
    console.log("\n测试IP定位工具 (ip_location)...");
    const ipResult = await client.callTool({
      name: "ip_location",
      arguments: { ip: "114.114.114.114" }
    });
    writeToLog('ip_location', ipResult);
    if (ipResult?.content?.[0]?.type === "text") {
      try {
        const data = JSON.parse(ipResult.content[0].text);
        if (data.status === "1" && data.province) {
          console.log(`省份: ${data.province}`);
          console.log(`城市: ${data.city}`);
          console.log(`运营商: ${data.isp || '未知'}`);
        } else {
          console.log("IP定位失败:", data);
        }
      } catch (err) {
        console.log("解析IP定位结果失败:", err);
      }
    }

    // 关闭连接
    await client.close();
    transport.close();
    console.log("\n所有工具测试完成！详细结果见 logs/stateless_test.log");
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testStatelessServer(); 