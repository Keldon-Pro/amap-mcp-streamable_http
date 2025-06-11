# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 只复制必要的源代码文件
COPY src/ ./src/
COPY tsconfig.json ./
COPY test/ ./test/
COPY .env* ./


# 构建应用
RUN npm run build


# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"] 