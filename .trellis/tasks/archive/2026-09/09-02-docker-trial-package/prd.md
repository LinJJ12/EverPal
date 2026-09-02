# Docker / 试用包

## Goal

让运营 / 自建方用 **Docker Compose 单入口** 最少步骤跑起玖伴（真 LLM），消除 README / product-constraints 标注的 Docker / 试用包欠账。对齐 PRD **OPS-03**（给运营的一键部署，不是给小孩看的能力）。

## Background

- 仓库无现成 `Dockerfile` / `docker-compose.yml`；`docs/directory-structure.md` 预留根级 compose，约定 `env_file: backend/.env`，Key 不进 Git。
- 前端 `VITE_API_BASE_URL` 为空时请求走同源相对路径；API 为 `/v1/...`，健康检查为 `/health`；Vue Router 为 `createWebHistory`（需 SPA fallback）。
- 后端默认 `HOST=127.0.0.1`；容器内须 `0.0.0.0`。SQLite：`DATABASE_URL=sqlite:///./data/companion.db`。
- `ALLOW_MOCK_LLM` 默认 false；语音 / 审核 Key 可选。

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | 交付形态 | 仅 Docker Compose（不做免 Docker zip/脚本） |
| D2 | 对外拓扑 | 单入口反代：静态前端 + `/v1`、`/health` → api；构建时 `VITE_API_BASE_URL` 置空 |
| D3 | 无真 Key | 要求填 `LLM_API_KEY`；默认不开 Mock；不做零 Key 假流式试用 profile |
| D4 | 访问范围 | 默认局域网可访问（发布 `0.0.0.0:端口`）；文档写本机 IP 用法 + **勿暴露公网**（无登录） |

## Requirements

| ID | Requirement |
|----|-------------|
| R1 | 根目录 `docker-compose.yml`：服务 `api` + `web`；对外只发布 **一个** 端口（默认 **8080**） |
| R2 | `web`：Nginx（或等价）托管 `frontend` 生产构建，反代 API；SSE（`/v1/chat/stream`）关闭缓冲；ASR 上传体积极限足够（约 ≥12MB） |
| R3 | `api`：Python ≥3.11 镜像跑 FastAPI；`HOST=0.0.0.0`；密钥仅经 `backend/.env`（`env_file`），不写入镜像层或已提交 compose |
| R4 | SQLite `data/` 用 volume 持久化；重建容器后同 volume 数据仍在 |
| R5 | 文档：最短 `cp .env.example → .env` → 填 Key → `docker compose up --build`；与本地 Conda/`npm run dev` 路径分开；标明 LAN 用法与公网禁止；`ALLOW_MOCK_LLM` 勿作试用默认 |
| R6 | 同步 README「当前阶段」与 `product-constraints`：Docker 试用包由欠账改为已提供（完成后） |

## Acceptance Criteria

- [ ] AC1：按文档配置真 `LLM_*` 后，`docker compose up --build`，浏览器打开 `http://localhost:8080`（或局域网 `http://<host-ip>:8080`）可完成流式陪伴聊天
- [ ] AC2：提交物与默认 compose/镜像构建上下文不含 API Key；`.env` 仍被 gitignore
- [ ] AC3：写入若干记忆/历史后 `compose down` 再 `up`（保留 volume），数据仍在
- [ ] AC4：未填 `LLM_API_KEY` 时不能当作成功试用；文档说明须填 Key；默认 `ALLOW_MOCK_LLM=false`
- [ ] AC5：文档含「勿将端口直接暴露公网」安全提示（D4）
- [ ] AC6：`docs/directory-structure.md` 中 Docker 相关描述与仓库实际文件一致

## Out of scope

- 免 Docker zip/脚本包；双端口试用拓扑；Compose 默认 Mock
- HTTPS / 证书自动化；镜像仓库推送 / K8s / 云托管面板
- 登录、家长面板、儿童安装器
- 以 `demo/` 为生产主路径；改聊天业务管线（除容器所需 env/HOST 外）

## Technical Notes（摘要，细节见 design.md）

- 推荐布局：`backend/Dockerfile`、`frontend/Dockerfile`（多阶段 Node build → Nginx）、根 `docker-compose.yml`、`deploy/nginx.conf`（或 `frontend/nginx.conf`）
- 反代须覆盖 `/v1/` 与 `/health`；SPA：`try_files` → `index.html`
- 可选 Key（`DASHSCOPE_*`、`MODERATION_*`）保持可选，与现网一致
