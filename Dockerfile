# ========== Build stage ==========
FROM node:22-alpine AS builder
WORKDIR /app
COPY ./package-lock.json ./
COPY ./package.json ./
RUN npm install --ignore-scripts
COPY ./public ./public
COPY ./src ./src
COPY ./tsconfig.json ./
RUN npm run build  # => /app/public に成果物

# ========== Production stage (nginx) ==========
FROM nginx:stable-alpine

# 1) user行コメントアウト (root前提の設定を無効化)
# 2) listen 80 → listen 8080 (default.confが無い場合はスキップ or 別ファイル書き換え)
# 3) パーミッション付与
RUN sed -i 's/^\s*user\s\+/#user /g' /etc/nginx/nginx.conf || true \
  && [ -f /etc/nginx/conf.d/default.conf ] \
  && sed -i 's/listen\s\+80;/listen 8080;/g' /etc/nginx/conf.d/default.conf \
  || echo "default.conf not found, skipping" \
  && chown -R nginx:nginx /var/run /var/cache/nginx /var/log/nginx \
  && chmod -R 770 /var/run /var/cache/nginx /var/log/nginx

# 4) ビルド成果物コピー
COPY --chown=root:root --chmod=555 --from=builder /app/public /usr/share/nginx/html

# (オプション) pidファイルを /tmp に出す場合
RUN sed -i 's@pid\s*/var/run/nginx.pid;@pid /tmp/nginx.pid;@' /etc/nginx/nginx.conf

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
