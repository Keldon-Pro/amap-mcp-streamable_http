# 高德地图 MCP 工具文档

## 工具概述
高德地图 MCP 工具是一组封装了高德地图 Web 服务 API 的工具集，提供了地理编码、路径规划、天气查询等功能。所有工具返回 JSON 格式数据。

## 通用参数说明
1. 坐标格式：
   - 所有经纬度坐标均使用 "经度,纬度" 格式
   - 经纬度小数点不超过6位
   - 多个坐标点使用"|"分隔

2. 分页参数：
   - offset: 每页记录数，默认20
   - page: 当前页数，默认1

3. 返回结果控制：
   - extensions: 
     - base: 返回基本信息
     - all: 返回全部信息

## 完整工具列表（12个）

### 1. 地理编码与逆地理编码
#### geo
- 功能：将结构化地址转换为经纬度坐标
- 必选参数：
  - address: 结构化地址信息（省+市+区+街道+门牌号）
- 可选参数：
  - city: 指定查询的城市（城市中文、中文全拼、citycode、adcode）

示例：
```javascript
// 地址转坐标
{
  "address": "云南省昆明市五华区翠湖公园",
  "city": "昆明"
}

// 返回结果
{
  "status": "1",
  "info": "OK",
  "geocodes": [{
    "location": "102.706432,24.974034",
    "level": "兴趣点",
    "address": "云南省昆明市五华区翠湖公园"
  }]
}
```

#### regeocode
- 功能：将经纬度坐标转换为结构化地址
- 必选参数：
  - location: 经纬度坐标（格式：经度,纬度）
- 可选参数：
  - extensions: 返回结果控制（base/all）
  - radius: 搜索半径
  - roadlevel: 道路等级（1表示仅输出主干道路）

示例：
```javascript
// 坐标转地址
{
  "location": "102.706432,24.974034"
}

// 返回结果
{
  "status": "1",
  "regeocode": {
    "formatted_address": "云南省昆明市五华区翠湖公园",
    "addressComponent": {
      "province": "云南省",
      "city": "昆明市",
      "district": "五华区",
      "township": "翠湖公园"
    }
  }
}
```

### 2. 路径规划类
#### direction_driving
- 功能：驾车路径规划
- 必选参数：
  - origin: 起点经纬度（格式：经度,纬度）
  - destination: 终点经纬度（格式：经度,纬度）
- 可选参数：
  - strategy: 导航策略
  - waypoints: 途经点（最多16个坐标点）
  - avoidpolygons: 避让区域
  - avoidroad: 避让道路

示例：
```javascript
// 驾车导航
{
  "origin": "102.706432,24.974034",
  "destination": "102.713001,24.977751",
  "strategy": 0,
  "waypoints": "102.708432,24.975034"
}

// 返回结果
{
  "status": "1",
  "route": {
    "paths": [{
      "distance": "2.3",  // 公里
      "duration": "15",   // 分钟
      "steps": [
        // 导航路径详情
      ]
    }]
  }
}
```

#### direction_walking
- 功能：步行路径规划
- 必选参数：
  - origin: 起点经纬度
  - destination: 终点经纬度

示例：
```javascript
// 步行导航
{
  "origin": "102.706432,24.974034",
  "destination": "102.713001,24.977751"
}

// 返回结果
{
  "status": "1",
  "route": {
    "paths": [{
      "distance": "1.2",  // 公里
      "duration": "20",   // 分钟
      "steps": []
    }]
  }
}
```

#### direction_transit_integrated
- 功能：公交路径规划
- 必选参数：
  - origin: 起点经纬度
  - destination: 终点经纬度
  - city: 起点城市
- 可选参数：
  - cityd: 终点城市（跨城必填）
  - strategy: 规划策略（0-5）
  - nightflag: 是否计算夜班车（0/1）
  - date: 出发日期
  - time: 出发时间

示例：
```javascript
// 公交换乘
{
  "origin": "102.706432,24.974034",
  "destination": "102.713001,24.977751",
  "city": "昆明",
  "strategy": 0,
  "nightflag": 0
}

// 返回结果
{
  "status": "1",
  "route": {
    "transits": [{
      "cost": "2",          // 花费
      "duration": "35",     // 分钟
      "walking_distance": "400", // 步行距离
      "segments": []        // 换乘细节
    }]
  }
}
```

#### bicycling
- 功能：骑行路径规划
- 必选参数：
  - origin: 起点经纬度
  - destination: 终点经纬度

示例：
```javascript
// 骑行导航
{
  "origin": "102.706432,24.974034",
  "destination": "102.713001,24.977751"
}

// 返回结果
{
  "status": "1",
  "data": {
    "paths": [{
      "distance": "1.8",    // 公里
      "duration": "12",     // 分钟
      "steps": []
    }]
  }
}
```

### 3. 搜索类
#### text_search
- 功能：关键词搜索 POI
- 必选参数：
  - keywords: 搜索关键词
- 可选参数：
  - city: 城市名称
  - types: POI类型
  - offset: 每页记录数
  - page: 当前页数
  - extensions: 返回结果控制（base/all）

示例：
```javascript
// 搜索景点
{
  "keywords": "翠湖公园",
  "city": "昆明",
  "types": "风景名胜",
  "offset": 20,
  "page": 1
}

// 返回结果
{
  "status": "1",
  "pois": [{
    "id": "B0367065BF",
    "name": "翠湖公园",
    "type": "风景名胜",
    "address": "翠湖南路67号",
    "location": "102.706432,24.974034"
  }]
}
```

#### around_search
- 功能：周边搜索
- 必选参数：
  - location: 中心点坐标
- 可选参数：
  - keywords: 搜索关键词
  - types: POI类型
  - radius: 搜索半径（米）
  - offset: 每页记录数
  - page: 当前页数

示例：
```javascript
// 搜索周边餐厅
{
  "location": "102.706432,24.974034",
  "keywords": "餐厅",
  "types": "餐饮服务",
  "radius": 1000
}

// 返回结果
{
  "status": "1",
  "pois": [{
    "name": "示例餐厅",
    "type": "餐饮服务",
    "distance": "500",
    "location": "102.707432,24.975034"
  }]
}
```

#### search_detail
- 功能：获取 POI 详细信息
- 必选参数：
  - id: POI ID

示例：
```javascript
// 获取POI详情
{
  "id": "B0367065BF"
}

// 返回结果
{
  "status": "1",
  "poi": {
    "id": "B0367065BF",
    "name": "翠湖公园",
    "type": "风景名胜",
    "tel": "0871-xxxxxxxx",
    "website": "http://example.com",
    "opening_hours": "06:00-22:00"
  }
}
```

### 4. 其他服务
#### weather
- 功能：查询指定城市的天气情况
- 必选参数：
  - city: 城市名称或 adcode
- 返回数据包含：
  - 城市信息
  - 实时天气
  - 预报天气（未来4天）

示例：
```javascript
// 查询天气
{
  "city": "昆明"
}

// 返回结果
{
  "status": "1",
  "lives": [{
    "city": "昆明市",
    "weather": "晴",
    "temperature": "22",
    "winddirection": "南",
    "windpower": "3"
  }],
  "forecasts": [
    // 未来天气预报
  ]
}
```

#### distance
- 功能：测量两点间距离
- 必选参数：
  - origins: 起点经纬度（支持多个起点）
  - destination: 终点经纬度
- 可选参数：
  - type: 测量方式（直线距离、驾车导航距离、步行导航距离）

示例：
```javascript
// 测量距离
{
  "origins": "102.706432,24.974034",
  "destination": "102.713001,24.977751",
  "type": "0"  // 0：直线距离，1：驾车导航距离
}

// 返回结果
{
  "status": "1",
  "results": [{
    "origin_id": "0",
    "distance": "1234",  // 米
    "duration": "300"    // 秒（驾车时间）
  }]
}
```

#### ip_location
- 功能：IP定位
- 必选参数：
  - ip: IP地址（不填则使用当前请求的IP）
- 返回数据包含：
  - IP所在城市
  - 经纬度位置
  - 所在省份

示例：
```javascript
// IP定位
{
  "ip": "114.242.xxx.xxx"
}

// 返回结果
{
  "status": "1",
  "province": "云南省",
  "city": "昆明市",
  "rectangle": "102.706432,24.974034;102.713001,24.977751"  // 所在城市经纬度范围
}
```

## 错误处理
所有接口的返回结果都包含 status 字段：
- "1": 成功
- "0": 失败

失败时会返回详细的错误信息：
```javascript
{
  "status": "0",
  "info": "INVALID_USER_KEY",
  "infocode": "10001"
}
```

## 注意事项
1. 所有坐标参数均使用经度,纬度格式
2. 经纬度小数点不超过6位
3. 跨城市公交路径规划需要同时提供起终点城市
4. 部分接口有调用频率限制
5. 返回的所有数据均为 JSON 格式
6. 建议在使用前先测试接口的可用性
7. 注意处理返回数据中的错误信息
8. 对于大批量请求，建议做好请求频率控制
9. 关键词搜索时，建议提供城市信息以提高准确性
