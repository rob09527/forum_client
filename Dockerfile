# ============================================================
# forum-client（Nuxt 3 SSR，端口 3000）
# 多阶段构建：编译阶段保留完整源码；运行阶段只保留 .output 产物，
# 不包含 app/ 下的 .vue/.ts 源码。
# ============================================================

# ---- 构建阶段 ----
FROM node:22-alpine AS build
WORKDIR /app

RUN sed -i "s@http://dl-cdn.alpinelinux.org/@https://repo.huaweicloud.com/@g" /etc/apk/repositories
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 默认切华为云源（本机国内构建快）；CI 用 --build-arg NPM_REGISTRY 覆盖为官方源
ARG NPM_REGISTRY=https://mirrors.huaweicloud.com/repository/npm/
RUN npm config set registry ${NPM_REGISTRY}
RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---- 运行阶段 ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 只拷 .output/（Nuxt/nitro 已把运行时依赖打进 .output/server/node_modules），镜像不再包含源码与完整 node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
