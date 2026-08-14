# ============================================================
# forum-client（Nuxt 3 SSR，端口 3000）
# 多阶段构建：编译阶段保留完整源码；运行阶段只保留 .output 产物，
# 不包含 app/ 下的 .vue/.ts 源码。
# ============================================================

# ---- 构建阶段 ----
FROM node:20-alpine AS build
WORKDIR /app

RUN sed -i "s@http://dl-cdn.alpinelinux.org/@https://repo.huaweicloud.com/@g" /etc/apk/repositories
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 切华为云源（实测比 npmmirror 快约 10 倍，且稳定）
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/
RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---- 运行阶段 ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 只拷 .output/（Nuxt/nitro 已把运行时依赖打进 .output/server/node_modules），镜像不再包含源码与完整 node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
