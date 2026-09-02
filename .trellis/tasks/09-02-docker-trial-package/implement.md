# Implement: Docker / 试用包

## Checklist

1. [x] 新增 `backend/Dockerfile`（3.11-slim，`WORKDIR /app`，安装 runtime deps，默认 `HOST` 可由 env 覆盖）
2. [x] 新增 `deploy/nginx.conf`（SPA、`/v1/`、`/health`、SSE 关缓冲、body 12m、超时）
3. [x] 新增 `frontend/Dockerfile`（build 阶段空 `VITE_API_BASE_URL` → nginx 阶段拷贝 dist + conf）
4. [x] 新增根 `docker-compose.yml`（`api` + `web`，`8080:80`，`env_file: backend/.env`，volume `jiuban-data`，`HOST=0.0.0.0`）
5. [x] 核对 `.gitignore` 仍忽略 `.env`；必要时在 `.env.example` 增加一行 Docker 提示（HOST/LAN 说明放文档即可）
6. [x] 文档：`README.md` Docker 段落 + 阶段状态；`docs/directory-structure.md`；可选 `docs/docker.md`；`product-constraints.md` 欠账句更新
7. [x] 本地验证：生产 bundle 同源、pytest 101、wheel 资产、compose config OK；`docker compose build` 受本机 Docker Hub 网络限制未跑通端到端（已写入 docs/docker.md 排障）

## Validation commands

```powershell
# 前置：backend/.env 已填 LLM_API_KEY；Docker Desktop 运行中
docker compose up --build -d
curl http://localhost:8080/health
# 浏览器：http://localhost:8080 完成一轮对话
docker compose down
docker compose up -d
# 再打开历史/记忆确认 volume
docker compose down
```

（无 Key 的机器可不跑真聊，但实现者须在有 Key 环境验 AC1。）

## Risk / rollback points

| Risk | Mitigation |
|------|------------|
| Nginx 缓冲导致 SSE 卡住 | conf 显式 `proxy_buffering off`；用手点流式聊天验 |
| 容器内 SQLite 路径错 | `WORKDIR /app` + volume `/app/data` + 默认 DATABASE_URL |
| Windows 行尾 / 上下文过大 | `.dockerignore` 排除 `node_modules`、`.git`、`vendor`、`.trellis` 大目录等 |
| 误提交 Key | 只 `env_file`；review compose 无明文 Key |

回滚：移除 compose/Docker 文件与文档段落即可；开发路径不动。

## Before `task.py start`

- [x] `prd.md` 已收敛（无未决 Open Questions）
- [x] `design.md` / `implement.md` 已写
- [x] `implement.jsonl` / `check.jsonl` 已填真实 spec 条目（validate 通过）
- [ ] 用户审阅规划并同意开始实现
