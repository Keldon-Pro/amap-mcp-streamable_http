# 高德地图 MCP Server & Client

本项目实现了**支持 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/specification/2025-03-26) Streamable HTTP 传输协议**的高德地图 Server（无状态/有状态）与配套 Client。

> 📖 本项目基于 [MCP 最新规范 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26) 开发。


## 📂 目录结构

```
.
├── server_stateless/   # 无状态高德地图 MCP Server
├── server_statefull/   # 有状态（会话管理）高德地图 MCP Server
├── client/             # MCP 协议客户端及测试用例
├── env.example         # 环境变量示例
└── README.md
```



## ✨ 功能特性

- **MCP 协议支持**：兼容 Claude、IDE 等 LLM 工具生态
- **Streamable HTTP**：支持流式 HTTP 传输
- **高德地图 API 封装**：地理/逆地理编码、路径规划、POI 搜索、天气、距离测量、IP定位等
- **无状态/有状态两种服务模式**：满足不同业务需求
- **TypeScript 实现**：类型安全，易于维护和扩展



## 🔌 MCP 传输协议对比：Streamable HTTP vs Stdio

### 🖥️ Stdio 传输协议

- 基于**标准输入输出流**（stdin/stdout），适合本地进程间通信
- 适合 CLI 工具、插件与本地 LLM 的集成
- 不支持 HTTP 网络请求，不适合云端或分布式场景
- 仅限本机使用，消息流动受限于本地进程生命周期

### 🌐 Streamable HTTP 传输协议

- **基于 HTTP/1.1**，支持 POST/GET 请求，适合 Web 服务和云原生部署
- 支持**流式消息**（如 Server-Sent Events, SSE），可实时推送多条消息给客户端
- 便于与浏览器、云端 LLM、远程 IDE 等现代应用集成
- 适合多客户端并发、跨平台、跨网络环境

#### 🚦 使用场景对比

| 协议类型         | 适用场景                                   | 网络访问 | 扩展性 |
|------------------|--------------------------------------------|----------|--------|
| Stdio            | 本地 CLI、插件、单机开发                   | ❌       | 一般   |
| Streamable HTTP  | Web 服务、云端部署、远程 LLM、团队协作      | ✅       | 极佳   |

#### 💡 为什么选择 Streamable HTTP？

- 更现代、更通用，易于与各类 LLM 平台（如 Claude Desktop、云端 IDE）对接
- 支持流式响应，提升交互体验
- 安全性与可扩展性更好，可结合 HTTP 认证、CORS、负载均衡等 Web 标准能力

> ⚠️ **注意：** MCP 官方推荐新项目优先采用 Streamable HTTP 协议，Stdio 主要用于兼容老旧本地插件场景。



## 🏷️ Stateless Server vs Stateful Server

### 🟢 无状态（Stateless）MCP Server

- **架构简单**：每个请求独立处理，不保存任何会话或上下文信息
- **高并发、易扩展**：适合云原生、负载均衡等场景
- **部署灵活**：可随时横向扩展，无需考虑会话同步
- **适用场景**：一次性查询、无多轮上下文需求的 LLM 工具、API 服务等

### 🟠 有状态（Stateful）MCP Server

- **会话管理**：为每个客户端分配独立的会话（Session），可保存上下文、历史、用户状态等
- **多轮交互**：支持复杂的多轮对话、任务跟踪、用户定制等高级功能
- **资源消耗更高**：需管理会话生命周期和资源释放
- **适用场景**：需要上下文记忆、长会话、多轮推理的 LLM 应用、个性化服务等



> **会话管理机制简介：**  
> - 服务端在初始化时通过 `Mcp-Session-Id` 响应头分配唯一会话 ID，客户端后续请求需携带该 ID  
> - 服务端可随时终止会话，客户端收到 404 后应重新初始化  
> - 客户端可通过 HTTP DELETE 主动关闭会话  
> 详细规范见 [MCP 2025-03-26 Session Management](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#session-management)



## 🚀 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/Keldon-Pro/amap-mcp-streamable_http.git
cd amap-mcp-streamable_http
```

### 2️⃣ 配置环境变量

复制根目录下的 `env.example` 到各子项目目录并重命名为 `.env`，填写你的高德地图 API Key：

```bash
cp env.example server_stateless/.env
cp env.example server_statefull/.env
# 编辑 .env 文件，填写 AMAP_MAPS_API_KEY
```

### 3️⃣ 安装依赖

分别在各子项目目录下安装依赖：

```bash
cd server_stateless && npm install
cd ../server_statefull && npm install
cd ../client && npm install
```

### 4️⃣ 构建与启动

#### 无状态服务端

```bash
cd server_stateless
npm run build
npm start
```

#### 有状态服务端

```bash
cd server_statefull
npm run build
npm start
```

#### 客户端测试

```bash
cd client
npm run build
npm start         # 基本功能测试
npm run test      # 全量工具自动化测试
```

> 📝 **注意：**  
> 如需切换无状态/有状态 MCP Server，请修改 `client/src/index.ts` 文件中的 `MCP_SERVER_URL` 变量，分别对应：  
> - 无状态服务端：`http://localhost:3000/mcp`  
> - 有状态服务端：`http://localhost:3001/mcp`


## 🧪 服务端测试说明

你可以通过以下方式对服务端进行功能验证：

### 1. 启动服务端

确保 `server_stateless` 或 `server_statefull` 已启动（见上文）。

### 2. 使用官方 MCP Inspector 可视化测试

- 访问 [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- 在 Inspector 页面输入你的 MCP Server 地址（如 `http://localhost:3000/mcp` 或 `http://localhost:3001/mcp`），点击 Connect
- 可在网页界面中交互式测试所有工具、查看请求与响应详情，便于调试和演示

### 3. 使用服务端自带测试脚本

- `server_stateless` 目录下有 `test.js`，可用于快速验证无状态服务端功能：
  ```bash
  cd server_stateless
  npm run test
  ```
- `server_statefull` 目录下有 `test-stateful.js` 和 `test-resume-session.js`，可用于验证有状态服务端的基本功能和会话恢复：
  ```bash
  cd server_statefull
  node .\test-stateful.js         # 测试有状态服务端功能
  node test-resume-session.js [session-id]      # 测试会话恢复功能
  ```

这些脚本会直接调用本地服务端接口，输出测试结果，适合开发调试和回归测试。

> ❗ 如遇到连接失败，请检查 server 是否已正确启动，端口和环境变量配置是否一致。



## ⚙️ 环境变量说明

请参考 `env.example` 文件，主要变量如下：

- `AMAP_MAPS_API_KEY`：高德地图开放平台 API Key（必填）
- `PORT`：服务端监听端口（可选，默认 3000）



## 📚 参考文档

- [MCP 官方文档](https://modelcontextprotocol.io/specification/2025-03-26)
- [高德开放平台](https://lbs.amap.com/dev/)



## 🤝 贡献

欢迎 issue、PR 和建议！



## 📚 高德地图 MCP 工具文档

本项目内置的 [`高德地图MCP工具.md`](./高德地图MCP工具.md) 文件，详细介绍了高德地图 MCP 工具的所有接口，包括地理编码、路径规划、天气查询、POI 搜索、距离测量、IP定位等功能的参数说明、示例和返回格式。  
该文档适用于开发者快速查阅 MCP 工具的用法和集成细节，便于二次开发和接口调试。

你也可以参考高德开放平台官方的 MCP Server 产品文档，获取最新的能力介绍和接口说明：  
[高德地图 MCP Server 官方文档](https://lbs.amap.com/api/mcp-server/summary)



