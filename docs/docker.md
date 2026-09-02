# Docker 试用

运营 / 自建用 **Docker Compose** 一键跑起玖伴（Everpal）（真 LLM）。开发者日常仍用 Conda + `npm run dev`（见 [`dev-setup.md`](./dev-setup.md)）。

## 最短步骤

```powershell
cd backend
copy .env.example .env
# 编辑 .env：填入 LLM_API_KEY（及按需 LLM_BASE_URL / LLM_MODEL）
cd ..
docker compose up --build
```

浏览器打开：**http://localhost:8080**，或局域网本机 IP 的 `8080` 端口。

首次启动时 `web` 会等 `api` 健康检查通过后再起来（约数秒到十几秒）。

| 要求 | 说明 |
|------|------|
| `LLM_API_KEY` | **必须**；未填不能当作成功试用 |
| `ALLOW_MOCK_LLM` | 保持 `false`（试用默认不要开 Mock） |
| 可选 Key | `DASHSCOPE_*`、`MODERATION_*` 与本地一致，可空 |
| Docker 引擎 | 需能拉取 `python` / `node` / `nginx` 基础镜像（Docker Hub 或已配置镜像加速） |

## 拓扑

- 对外只发布 **8080** → `web`（Nginx 静态前端 + 反代）
- `/v1/`、`/health` → 内部服务 `api:8000`（不对外暴露端口）
- SQLite：`DATABASE_URL=sqlite:////app/data/companion.db`（绝对路径）→ named volume **`jiuban-data`**
- 前端生产构建用 `frontend/.env.production`（空的 `VITE_API_BASE_URL`）走**同源**相对路径；本地 `npm run dev` 仍用 `.env` 指向 `:8000`

## 安全

- 默认可局域网访问；**勿将端口直接暴露公网**（产品无登录）。
- 密钥只来自宿主机 `backend/.env`（`env_file`）；勿写入已提交的 `docker-compose.yml` 或镜像层。

## 与本地开发对照

| | Docker 试用 | 本地开发 |
|--|-------------|---------|
| 入口 | `http://localhost:8080` | 前端 `5173` + 后端 `8000` |
| 前端 API | 同源（`.env.production` 空 base） | `.env` → `http://127.0.0.1:8000` |
| 数据 | volume `jiuban-data` | `backend/data/companion.db` |
| 改代码 | 需 `compose up --build` | 热重载 / 直接 `python main.py` |

## 常用命令

```powershell
docker compose up --build -d   # 后台
docker compose down            # 停容器（保留 volume）
docker compose down -v         # 停并删除试用数据 volume
curl http://localhost:8080/health
```

重建容器但保留 volume 时，记忆 / 历史仍在。

## 排障

| 现象 | 排查 |
|------|------|
| 页面开得开但请求打到 `127.0.0.1:8000` 失败 | 确认用的是 Compose 构建的 `web` 镜像（含空 API base）；不要把本地 `vite` 开发包当成试用入口 |
| `compose build` 拉基础镜像超时 | 配置镜像加速或稍后重试；属环境网络，不是业务代码错误 |
| `web` 一直起不来 | `docker compose logs api`；确认 `backend/.env` 存在且 `api` healthcheck 通过 |
