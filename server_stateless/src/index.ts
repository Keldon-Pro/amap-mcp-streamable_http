import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod";
import fetch from "node-fetch";
import cors from 'cors';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface AmapBaseResponse {
    status: string;
    info?: string;
    infocode?: string;
    errcode?: number;
    [key: string]: any;
}

const app = express();
app.use(express.json());
app.use(cors());


// 工具注册函数，返回已注册好所有工具的McpServer实例
function getServer() {
  const server = new McpServer({
    name: "amap-maps",
    version: "1.0.0"
  });
  const API_KEY = process.env.AMAP_MAPS_API_KEY!;

  // 地理编码
  server.tool("geo", 
    {
      address: z.string(),
      city: z.string().optional()
    }, 
    async ({ address, city }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, address, ...(city ? { city } : {}) });
        const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Geocoding failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 逆地理编码
  server.tool("regeocode", 
    {
      location: z.string(),
      extensions: z.string().optional(),
      radius: z.string().optional(),
      roadlevel: z.string().optional()
    }, 
    async ({ location, extensions, radius, roadlevel }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, location, ...(extensions ? { extensions } : {}), ...(radius ? { radius } : {}), ...(roadlevel ? { roadlevel } : {}) });
        const url = `https://restapi.amap.com/v3/geocode/regeo?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `ReGeocoding failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 驾车路径规划
  server.tool("direction_driving", 
    {
      origin: z.string(),
      destination: z.string(),
      strategy: z.union([z.string(), z.number()]).optional(),
      waypoints: z.string().optional(),
      avoidpolygons: z.string().optional(),
      avoidroad: z.string().optional()
    }, 
    async ({ origin, destination, strategy, waypoints, avoidpolygons, avoidroad }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, origin, destination, ...(strategy ? { strategy: String(strategy) } : {}), ...(waypoints ? { waypoints } : {}), ...(avoidpolygons ? { avoidpolygons } : {}), ...(avoidroad ? { avoidroad } : {}) });
        const url = `https://restapi.amap.com/v3/direction/driving?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Driving direction failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 步行路径规划
  server.tool("direction_walking", 
    {
      origin: z.string(),
      destination: z.string()
    }, 
    async ({ origin, destination }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, origin, destination });
        const url = `https://restapi.amap.com/v3/direction/walking?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Walking direction failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 公交路径规划
  server.tool("direction_transit_integrated", 
    {
      origin: z.string(),
      destination: z.string(),
      city: z.string(),
      cityd: z.string().optional(),
      strategy: z.union([z.string(), z.number()]).optional(),
      nightflag: z.union([z.string(), z.number()]).optional(),
      date: z.string().optional(),
      time: z.string().optional()
    }, 
    async ({ origin, destination, city, cityd, strategy, nightflag, date, time }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, origin, destination, city, ...(cityd ? { cityd } : {}), ...(strategy ? { strategy: String(strategy) } : {}), ...(nightflag ? { nightflag: String(nightflag) } : {}), ...(date ? { date } : {}), ...(time ? { time } : {}) });
        const url = `https://restapi.amap.com/v3/direction/transit/integrated?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Transit direction failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 骑行路径规划
  server.tool("bicycling", 
    {
      origin: z.string(),
      destination: z.string()
    }, 
    async ({ origin, destination }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, origin, destination });
        const url = `https://restapi.amap.com/v4/direction/bicycling?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (data.errcode && data.errcode !== 0) {
          return { content: [{ type: "text", text: `Bicycling direction failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 关键词搜索POI
  server.tool("text_search", 
    {
      keywords: z.string(),
      city: z.string().optional(),
      types: z.string().optional(),
      offset: z.union([z.string(), z.number()]).optional(),
      page: z.union([z.string(), z.number()]).optional(),
      extensions: z.string().optional()
    }, 
    async ({ keywords, city, types, offset, page, extensions }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, keywords, ...(city ? { city } : {}), ...(types ? { types } : {}), ...(offset ? { offset: String(offset) } : {}), ...(page ? { page: String(page) } : {}), ...(extensions ? { extensions } : {}) });
        const url = `https://restapi.amap.com/v3/place/text?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Text search failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 周边搜索
  server.tool("around_search", 
    {
      location: z.string(),
      keywords: z.string().optional(),
      types: z.string().optional(),
      radius: z.union([z.string(), z.number()]).optional(),
      offset: z.union([z.string(), z.number()]).optional(),
      page: z.union([z.string(), z.number()]).optional()
    }, 
    async ({ location, keywords, types, radius, offset, page }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, location, ...(keywords ? { keywords } : {}), ...(types ? { types } : {}), ...(radius ? { radius: String(radius) } : {}), ...(offset ? { offset: String(offset) } : {}), ...(page ? { page: String(page) } : {}) });
        const url = `https://restapi.amap.com/v3/place/around?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Around search failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // POI详情
  server.tool("search_detail", 
    {
      id: z.string()
    }, 
    async ({ id }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, id });
        const url = `https://restapi.amap.com/v3/place/detail?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `POI detail failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 天气查询
  server.tool("weather", 
    {
      city: z.string()
    }, 
    async ({ city }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, city, extensions: "all" });
        const url = `https://restapi.amap.com/v3/weather/weatherInfo?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Weather query failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // 距离测量
  server.tool("distance", 
    {
      origins: z.string(),
      destination: z.string(),
      type: z.string().optional()
    }, 
    async ({ origins, destination, type }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, origins, destination, ...(type ? { type } : {}) });
        const url = `https://restapi.amap.com/v3/distance?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `Distance query failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // IP定位
  server.tool("ip_location", 
    {
      ip: z.string().optional()
    }, 
    async ({ ip }) => {
      try {
        const params = new URLSearchParams({ key: API_KEY, ...(ip ? { ip } : {}) });
        const url = `https://restapi.amap.com/v3/ip?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json() as AmapBaseResponse;
        if (String(data.status) !== "1") {
          return { content: [{ type: "text", text: `IP location failed: ${data.info || data.infocode}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Request failed: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  return server;
}

app.post('/mcp', async (req, res) => {
  try {
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// GET/DELETE /mcp 可直接返回 405
app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null
  });
});
app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Amap Maps MCP Stateless Server running on http://localhost:${PORT}/mcp`);
});