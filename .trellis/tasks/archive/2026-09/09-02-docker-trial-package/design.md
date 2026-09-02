# Design: Docker / 试用包

## Architecture

```text
浏览器 ──► :8080 web (Nginx)
              ├─ /*           → 静态 dist（Vue SPA + public/games）
              ├─ /v1/*        → proxy_pass http://api:8000
              └─ /health      → proxy_pass http://api:8000

api 容器内：uvicorn HOST=0.0.0.0 PORT=8000
           volume → /app/data（SQLite companion.db）
           env_file → backend/.env（宿主机，未提交）
```

不把前端塞进 FastAPI `StaticFiles`：保持目录约定（backend 不做页面），反代边界清晰。

## Components

| Piece | Role |
|-------|------|
| `backend/Dockerfile` | `python:3.11-slim`；`pip install .`（非 dev extra）；`CMD` 跑 `python main.py` 或 uvicorn |
| `frontend/Dockerfile` | stage1：`node` + `npm ci` + `npm run build`（`ARG/ENV VITE_API_BASE_URL=` 空串）；stage2：`nginx:alpine` + 拷贝 dist + nginx 配置 |
| `deploy/nginx.conf`（推荐） | SPA fallback；`/v1/` + `/health` 反代；SSE `proxy_buffering off`；`client_max_body_size 12m`；长超时 |
| `docker-compose.yml` | `api` + `web`；`ports: ["8080:80"]`；`api` 不对外暴露端口（仅 compose 网络）；named volume `jiuban-data` → api `/app/data` |

## Config / secrets

- **唯一密钥来源**：宿主机 `backend/.env`（从 `.env.example` 复制）。compose：`env_file: ./backend/.env`。
- Compose `environment` 覆盖容器内必需项：`HOST=0.0.0.0`；必要时 `DATABASE_URL=sqlite:///./data/companion.db`（与 volume 对齐）。
- **不要**在已提交 yaml 里写 `LLM_API_KEY=...`。
- `ALLOW_MOCK_LLM`：不在 compose 里强制 true；跟随 `.env`（example 为 false）。
- 同源部署下浏览器不依赖 CORS；可保留 example 中的开发 CORS，或在文档说明 Docker 下可忽略。不必为 LAN IP 枚举 CORS（同源已覆盖）。

## Streaming & uploads

- `/v1/chat/stream`：Nginx `proxy_buffering off`、`proxy_http_version 1.1`、足够 `proxy_read_timeout`（建议 ≥3600s）。
- `/v1/speech/*`：`client_max_body_size` ≥ 后端 `speech_asr_max_bytes`（10MB）→ 取 12m。

## SPA & assets

- `try_files $uri $uri/ /index.html;`
- `frontend/public/games/` 经 Vite 进入 dist，无需单独卷。

## Persistence

- Named volume `jiuban-data` → 容器内 backend 工作目录下 `data/`。
- 工作目录固定为 `/app`（Dockerfile `WORKDIR`），与 `sqlite:///./data/companion.db` 一致。

## Docs touchpoints

- 根 `README.md`：新增「Docker 试用」最短步骤；「当前阶段」去掉 Docker 欠账表述。
- `docs/directory-structure.md`：标明真实存在的 compose / Dockerfile / nginx 路径。
- `.trellis/spec/guides/product-constraints.md`：Phase-1 deferred 句改为已提供 Compose 试用路径。
- 可选短文 `docs/docker.md`：LAN、公网禁止、volume、与本地开发对照（若 README 过长则拆）。

## Trade-offs

| Choice | Why | Rejected |
|--------|-----|----------|
| api + web 两服务 | 符合分层；nginx 专责 SSE/静态 | 单容器 all-in-one（难维护、违背 backend 不托管 UI） |
| 仅发布 8080 | 一地址；api 不暴露 | 双端口（D2 已否） |
| named volume | 跨 OS 路径简单 | bind mount `./data`（Windows 权限偶发烦；文档可附录如何改 bind） |
| 不推镜像仓库 | OPS-03 自建 `compose up --build` 足够 | 本期不做 GHCR/DockerHub 发布流水线 |

## Rollback

- 删除/不使用 compose 与 Dockerfile 即可回退到 Conda + `npm run dev`；不影响现有开发路径。
- Volume 可 `docker volume rm` 清空试用数据（文档注明）。

## Compatibility

- 开发者本机工作流不变。
- 不改聊天管线代码，除非发现 `HOST`/路径在容器下必须的最小 env 修正。
