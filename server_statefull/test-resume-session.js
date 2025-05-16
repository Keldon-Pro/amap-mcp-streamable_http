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

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001/mcp";

// Get session ID from command line if provided
const sessionId = process.argv[2];

// 工具函数：写入日志，时间戳为北京时间
function writeToLog(sessionId, toolName, data) {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const logFileName = `session_${sessionId}.log`;
  const logPath = path.join(logDir, logFileName);
  const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
  const logEntry = `\n\n--- ${timestamp} - ${toolName} ---\n${JSON.stringify(data, null, 2)}`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logEntry);
  } else {
    const initialContent = `SESSION ID: ${sessionId}\n创建时间: ${timestamp}${logEntry}`;
    fs.writeFileSync(logPath, initialContent);
  }
  console.log(`详细信息已保存到会话日志: ${logPath}`);
}

async function testResumeSession() {
  console.log("测试会话恢复...");
  console.log(`连接到服务器: ${MCP_SERVER_URL}`);
  
  if (sessionId) {
    console.log(`尝试恢复会话ID: ${sessionId}`);
  } else {
    console.log("未提供会话ID，将创建新会话");
  }

  try {
    // 创建 MCP 客户端
    const client = new Client({ name: "amap-maps-mcp-client", version: "1.0.0" });
    
    // 创建传输层，如果提供了会话ID则尝试恢复会话
    const transport = new StreamableHTTPClientTransport(
      new URL(MCP_SERVER_URL),
      sessionId ? { sessionId } : undefined
    );
    
    // 连接到服务器并初始化
    console.log("连接并初始化...");
    await client.connect(transport);

    // 获取会话状态
    console.log("连接建立，服务器接受了我们的请求");
    console.log(`此连接的会话 ID: ${transport.sessionId}`);
    console.log(`${sessionId && transport.sessionId === sessionId ? '✓ 成功恢复同一会话' : '⚠ 创建了新会话'}`);
    
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
    }
    
    // 调用天气查询工具
    console.log("\n测试天气查询工具...");
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
            // 写入日志
            writeToLog(transport.sessionId, 'weather', data);
          } else {
            console.log("天气查询失败:", data);
          }
        } catch (err) {
          console.log("解析天气查询结果失败:", err);
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
  testResumeSession();
}, 1000); // 等待1秒后开始测试，确保有时间阅读提示