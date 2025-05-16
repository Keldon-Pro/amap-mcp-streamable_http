import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('警告: .env 文件未找到，将使用默认配置');
}

// 从环境变量中获取 MCP_SERVER_URL，提供默认值并进行格式验证
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001/mcp";

// 工具函数：创建日志目录和写入日志文件
function writeToLog(sessionId, toolName, data) {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  // 使用session-id作为日志文件名
  const logFileName = `session_${sessionId}.log`;
  const logPath = path.join(logDir, logFileName);
  
  // 构造日志内容，添加时间戳和工具名称
  const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
  const logEntry = `\n\n--- ${timestamp} - ${toolName} ---\n${JSON.stringify(data, null, 2)}`;
  
  // 检查文件是否存在，存在则追加，不存在则创建新文件
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logEntry);
  } else {
    // 首次创建文件，添加会话ID信息
    const initialContent = `SESSION ID: ${sessionId}\n创建时间: ${timestamp}${logEntry}`;
    fs.writeFileSync(logPath, initialContent);
  }
  
  console.log(`详细信息已保存到会话日志: ${logPath}`);
}

async function testStatefulServer() {
  console.log("测试有状态服务器...");
  console.log(`连接到服务器: ${MCP_SERVER_URL}`);
  
  try {
    // 创建 MCP 客户端
    const client = new Client({ name: "amap-maps-mcp-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
    
    // 连接到服务器并初始化
    console.log("连接并初始化...");
    await client.connect(transport);

    // 获取会话状态
    console.log("连接建立，服务器接受了我们的初始化请求");
    console.log("这表明有状态服务器已接受连接并分配了会话ID（在服务器端维护）");
    console.log(`此连接的会话 ID: ${transport.sessionId}`);
    
    // 存储会话ID用于日志
    const sessionId = transport.sessionId;
    
    // 列出可用工具
    console.log("\n获取可用工具列表...");
    const toolsResult = await client.listTools();
    console.log(`找到 ${toolsResult.tools?.length || 0} 个工具`);
    
    if (toolsResult.tools && toolsResult.tools.length > 0) {
      toolsResult.tools.forEach(tool => {
        console.log(`- ${tool.name}`);
      });
    } else {
      console.log("没有找到工具或工具列表为空");
      return;
    }
    
    // 测试地理编码工具
    console.log("\n测试地理编码工具 (geo)...");
    const geoResult = await client.callTool({
      name: "geo",
      arguments: { 
        address: "海南省海口市龙华区华彩·海口湾广场", 
        city: "海口" 
      }
    });
    
    if (geoResult && geoResult.content && Array.isArray(geoResult.content) && geoResult.content.length > 0) {
      const content = geoResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.geocodes && data.geocodes.length > 0) {
            console.log(`地址: ${data.geocodes[0].formatted_address}`);
            console.log(`坐标: ${data.geocodes[0].location}`);
          } else {
            console.log("地理编码失败:", data);
          }
        } catch (err) {
          console.log("解析地理编码结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试逆地理编码工具
    console.log("\n测试逆地理编码工具 (regeocode)...");
    const regeoResult = await client.callTool({
      name: "regeocode",
      arguments: { location: "110.312589,20.055793" }
    });
    
    if (regeoResult && regeoResult.content && Array.isArray(regeoResult.content) && regeoResult.content.length > 0) {
      const content = regeoResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.regeocode) {
            console.log(`地址: ${data.regeocode.formatted_address}`);
            if (data.regeocode.addressComponent) {
              console.log(`城市: ${data.regeocode.addressComponent.city || '未知'}`);
              console.log(`区域: ${data.regeocode.addressComponent.district || '未知'}`);
            }
          } else {
            console.log("逆地理编码失败:", data);
          }
        } catch (err) {
          console.log("解析逆地理编码结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试驾车路径规划
    console.log("\n测试驾车路径规划工具 (direction_driving)...");
    const drivingResult = await client.callTool({
      name: "direction_driving",
      arguments: { 
        origin: "110.312589,20.055793", 
        destination: "110.330162,20.022889" 
      }
    });
    
    if (drivingResult && drivingResult.content && Array.isArray(drivingResult.content) && drivingResult.content.length > 0) {
      const content = drivingResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.route && data.route.paths && data.route.paths.length > 0) {
            const path = data.route.paths[0];
            console.log(`驾车距离: ${path.distance}米`);
            console.log(`预计时间: ${path.duration}秒`);
            
            // 将详细导航路径写入日志
            writeToLog(sessionId, 'direction_driving', data);
          } else {
            console.log("驾车路径规划失败:", data);
          }
        } catch (err) {
          console.log("解析驾车路径规划结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试步行路径规划
    console.log("\n测试步行路径规划工具 (direction_walking)...");
    const walkingResult = await client.callTool({
      name: "direction_walking",
      arguments: { 
        origin: "110.312589,20.055793", 
        destination: "110.330162,20.022889" 
      }
    });
    
    if (walkingResult && walkingResult.content && Array.isArray(walkingResult.content) && walkingResult.content.length > 0) {
      const content = walkingResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.route && data.route.paths && data.route.paths.length > 0) {
            const path = data.route.paths[0];
            console.log(`步行距离: ${path.distance}米`);
            console.log(`预计时间: ${path.duration}秒`);
            
            // 将详细导航路径写入日志
            writeToLog(sessionId, 'direction_walking', data);
          } else {
            console.log("步行路径规划失败:", data);
          }
        } catch (err) {
          console.log("解析步行路径规划结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试公交路径规划
    console.log("\n测试公交路径规划工具 (direction_transit_integrated)...");
    const transitResult = await client.callTool({
      name: "direction_transit_integrated",
      arguments: { 
        origin: "110.312589,20.055793", 
        destination: "110.330162,20.022889",
        city: "海口",
        cityd: "海口"
      }
    });
    
    if (transitResult && transitResult.content && Array.isArray(transitResult.content) && transitResult.content.length > 0) {
      const content = transitResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.route && data.route.transits && data.route.transits.length > 0) {
            const transit = data.route.transits[0];
            console.log(`公交路线数量: ${data.route.transits.length}`);
            console.log(`第一条路线距离: ${transit.distance}米`);
            console.log(`预计时间: ${transit.duration}秒`);
            
            // 将详细导航路径写入日志
            writeToLog(sessionId, 'direction_transit_integrated', data);
          } else {
            console.log("公交路径规划失败:", data);
          }
        } catch (err) {
          console.log("解析公交路径规划结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试骑行路径规划
    console.log("\n测试骑行路径规划工具 (bicycling)...");
    const bicyclingResult = await client.callTool({
      name: "bicycling",
      arguments: { 
        origin: "110.312589,20.055793", 
        destination: "110.330162,20.022889" 
      }
    });
    
    if (bicyclingResult && bicyclingResult.content && Array.isArray(bicyclingResult.content) && bicyclingResult.content.length > 0) {
      const content = bicyclingResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          
          // 修改判断条件，检查errcode为0表示成功
          if ((data.errcode === 0 || data.status === "1") && data.data && data.data.paths && data.data.paths.length > 0) {
            const path = data.data.paths[0];
            console.log(`骑行距离: ${path.distance || '未知'}米`);
            console.log(`预计时间: ${path.duration || '未知'}秒`);
            console.log(`骑行路段数: ${path.steps ? path.steps.length : '未知'}`);
            
            // 将详细导航路径写入日志
            writeToLog(sessionId, 'bicycling', data);
          } else {
            console.log("骑行路径规划失败:", data);
          }
        } catch (err) {
          console.log("解析骑行路径规划结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试关键字搜索
    console.log("\n测试关键字搜索工具 (text_search)...");
    const textSearchResult = await client.callTool({
      name: "text_search",
      arguments: { 
        keywords: "咖啡",
        city: "海口"
      }
    });
    
    if (textSearchResult && textSearchResult.content && Array.isArray(textSearchResult.content) && textSearchResult.content.length > 0) {
      const content = textSearchResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.pois && data.pois.length > 0) {
            console.log(`找到 ${data.pois.length} 个位置`);
            console.log(`第一个结果: ${data.pois[0].name}`);
            console.log(`地址: ${data.pois[0].address}`);
            console.log(`坐标: ${data.pois[0].location}`);
          } else {
            console.log("关键字搜索失败:", data);
          }
        } catch (err) {
          console.log("解析关键字搜索结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试周边搜索
    console.log("\n测试周边搜索工具 (around_search)...");
    const aroundSearchResult = await client.callTool({
      name: "around_search",
      arguments: { 
        keywords: "餐厅",
        location: "110.312589,20.055793",
        radius: "1000"
      }
    });
    
    if (aroundSearchResult && aroundSearchResult.content && Array.isArray(aroundSearchResult.content) && aroundSearchResult.content.length > 0) {
      const content = aroundSearchResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.pois && data.pois.length > 0) {
            console.log(`周边1公里找到 ${data.pois.length} 个餐厅`);
            console.log(`第一个结果: ${data.pois[0].name}`);
            console.log(`地址: ${data.pois[0].address || '未知'}`);
            console.log(`距离: ${data.pois[0].distance || '未知'}米`);
            
            // 保存第一个POI的ID，用于测试search_detail
            global.poiId = data.pois[0].id;
          } else {
            console.log("周边搜索失败:", data);
          }
        } catch (err) {
          console.log("解析周边搜索结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试POI详情
    if (global.poiId) {
      console.log("\n测试POI详情查询工具 (search_detail)...");
      const detailResult = await client.callTool({
        name: "search_detail",
        arguments: { id: global.poiId }
      });
      
      if (detailResult && detailResult.content && Array.isArray(detailResult.content) && detailResult.content.length > 0) {
        const content = detailResult.content[0];
        if (content.type === "text" && content.text) {
          try {
            const data = JSON.parse(content.text);
            if (data.status === "1" && data.pois && data.pois.length > 0) {
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
            console.log("原始返回:", content.text);
          }
        }
      }
    }
    
    // 测试天气查询工具
    console.log("\n测试天气查询工具 (weather)...");
    const weatherResult = await client.callTool({
      name: "weather",
      arguments: { city: "海口" }
    });
    
    if (weatherResult && weatherResult.content && Array.isArray(weatherResult.content) && weatherResult.content.length > 0) {
      const content = weatherResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.forecasts && data.forecasts.length > 0) {
            console.log(`地区: ${data.forecasts[0].city}`);
            console.log(`预报时间: ${data.forecasts[0].reporttime}`);
            console.log("天气预报:");
            data.forecasts[0].casts.slice(0, 2).forEach(cast => {
              console.log(`- ${cast.date}: 白天 ${cast.dayweather} ${cast.daytemp}°C, 夜间 ${cast.nightweather} ${cast.nighttemp}°C`);
            });
          } else {
            console.log("天气查询失败:", data);
          }
        } catch (err) {
          console.log("解析天气查询结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试距离测量
    console.log("\n测试距离测量工具 (distance)...");
    const distanceResult = await client.callTool({
      name: "distance",
      arguments: { 
        origins: "110.312589,20.055793",
        destination: "110.330162,20.022889",
        type: "1" // 驾车距离
      }
    });
    
    if (distanceResult && distanceResult.content && Array.isArray(distanceResult.content) && distanceResult.content.length > 0) {
      const content = distanceResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.results && data.results.length > 0) {
            const result = data.results[0];
            console.log(`驾车距离: ${result.distance}米`);
            console.log(`预计时间: ${result.duration}秒`);
          } else {
            console.log("距离测量失败:", data);
          }
        } catch (err) {
          console.log("解析距离测量结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    // 测试IP定位
    console.log("\n测试IP定位工具 (ip_location)...");
    const ipResult = await client.callTool({
      name: "ip_location",
      arguments: { ip: "114.114.114.114" } // 使用114DNS的IP
    });
    
    if (ipResult && ipResult.content && Array.isArray(ipResult.content) && ipResult.content.length > 0) {
      const content = ipResult.content[0];
      if (content.type === "text" && content.text) {
        try {
          const data = JSON.parse(content.text);
          if (data.status === "1" && data.province) {
            console.log(`省份: ${data.province}`);
            console.log(`城市: ${data.city}`);
            console.log(`运营商: ${data.isp}`);
          } else {
            console.log("IP定位失败:", data);
          }
        } catch (err) {
          console.log("解析IP定位结果失败:", err);
          console.log("原始返回:", content.text);
        }
      }
    }
    
    console.log("\n测试完成！会话仍保持活跃状态，只要持续使用，会话将一直有效。");
    console.log("（注意：如果会话闲置超过1小时没有请求，则会自动终止）");
    console.log(`你可以通过会话ID ${transport.sessionId} 继续使用这个会话。`);
    console.log('使用命令: node test-resume-session.js ' + transport.sessionId);
  } catch (error) {
    console.error("测试过程中出错:", error);
  }
}

// 修正显示的服务器地址为实际使用的地址
console.log("开始测试，请确保有状态服务器在 " + MCP_SERVER_URL + " 正在运行");
console.log("如果服务器未启动，请先运行 'npm start' 启动服务器");
setTimeout(() => {
  testStatefulServer();
}, 1000); // 等待1秒后开始测试，确保有时间阅读提示