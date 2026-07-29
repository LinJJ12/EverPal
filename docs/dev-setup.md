# 本地开发环境说明

> **约定**：本仓库 Python 后端统一使用 **Conda 环境 `chatbot`**，不要另建 `backend/.venv`（除非你明确不用 conda）。

## 技术栈速览

| 端 | 运行时 / 栈 | 依赖清单 |
|----|-------------|---------|
| 后端 `backend/` | Python **≥3.11** · FastAPI · Uvicorn · httpx · Pydantic | `backend/pyproject.toml` |
| 前端 `frontend/` | Node.js · Vue 3 · Vite · TypeScript · Vue Router · Pinia | `frontend/package.json` |

LLM API Key **只**放在 `backend/.env`；前端仅 `VITE_API_BASE_URL`。

---

## 1. Conda 环境 `chatbot`（后端）

### 1.1 已有环境（推荐）

本机若已创建名为 `chatbot` 的 conda 环境（Python 3.11+）：

```powershell
conda activate chatbot
cd C:\Users\Administrator\Desktop\chatbot\backend
pip install -e ".[dev]"
```

确认版本：

```powershell
python --version   # 应为 3.11.x（或更高，且 ≥3.11）
where.exe python   # 应指向 ...\envs\chatbot\...
```

### 1.2 首次创建（新机器）

```powershell
conda create -n chatbot python=3.11 -y
conda activate chatbot
cd <仓库根>\backend
pip install -e ".[dev]"
copy .env.example .env
# 编辑 .env：填入 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL 等
```

依赖以 `pyproject.toml` 为准，**不必**再维护单独的 `requirements.txt`。日常安装/更新：

```powershell
conda activate chatbot
cd backend
pip install -e ".[dev]"
```

### 1.3 启动后端

```powershell
conda activate chatbot
cd <仓库根>\backend
python main.py
```

- 健康检查：http://127.0.0.1:8000/health  
- 默认端口见 `backend/.env` 的 `PORT`（一般为 `8000`）

### 1.4 与 `.venv` 的关系

| 方式 | 是否采用 |
|------|----------|
| `conda activate chatbot` | **是，本项目标准做法** |
| `python -m venv backend/.venv` | 否（避免双环境混淆）；文档与脚本以 conda 为准 |

---

## 2. 前端（Node，不进 conda）

前端不依赖 Python / conda，使用系统 Node.js：

```powershell
cd <仓库根>\frontend
copy .env.example .env    # 若尚无 .env；仅 VITE_API_BASE_URL
npm install               # 首次或依赖变更后
npm run dev
```

打开 http://localhost:5173 。开发时 Vite 可将 `/v1`、`/health` 代理到后端；也可直接用 `VITE_API_BASE_URL=http://127.0.0.1:8000`。

界面已按 `demo/` 产品壳迁入（首页英雄区、路径页、聊天侧栏、游戏大厅）。游戏对局页：`/games/*.html`（静态资源在 `frontend/public/games/`，当前 **12 款**；列表见 `frontend/src/utils/gamesMeta.ts`）。新增游戏步骤见 `frontend/public/games/README.md`；冒烟：`cd frontend && npm run test:games`。

场景 / 安全入口会带 `seed` 进入真实流式聊天（不再使用 demo 本地脚本慢放）。

---

## 3. 日常联调清单

开两个终端：

```powershell
# 终端 1 — 后端
conda activate chatbot
cd <仓库根>\backend
python main.py

# 终端 2 — 前端
cd <仓库根>\frontend
npm run dev
```

浏览器进入「聊天」页即可验证 SSE 流式回复（需 `backend/.env` 中 LLM 可用，或后端允许的 mock 配置）。

**语音（可选）**：在 `backend/.env` 配置 `DASHSCOPE_API_KEY`（及按需的 `DASHSCOPE_BASE_URL` / `DASHSCOPE_COMPAT_BASE_URL`、音色变量）。有 Key 时聊天页输入区「说话」与气泡「朗读」走云端；无 Key 或上游失败时自动回退浏览器 Web Speech。变量名见 `backend/.env.example`。

**联网百科（可选）**：默认开启（`WIKI_ENABLED=true`）。聊天页在输入区底栏点 **「百科」** 后再发送，才会查维基；普通聊天不检索。超时/无结果/标题与主题不相关时静默降级（不挂错来源）。可用 `WIKI_TIMEOUT_SECONDS` / `WIKI_MAX_CHARS` 调节；设 `WIKI_ENABLED=false` 关闭。

**第三方入站审核（可选）**：默认关闭（`MODERATION_ENABLED=false`）。开通阿里云 AI 安全护栏并配置 `MODERATION_ACCESS_KEY_ID` / `MODERATION_ACCESS_KEY_SECRET` 后，词库未命中的用户消息会再走 `query_security_check`；超时或上游错误 **fail-open**（放行，词库仍兜底）。与 `DASHSCOPE_API_KEY` 分开。

冒烟脚本（后端已启动时）：

```powershell
conda activate chatbot
cd backend
python scripts/e2e_smoke.py
# 可选：维基相关性（需外网）
python scripts/wiki_relevance_smoke.py
```

---

## 4. 本机系统代理注意

若本机开了 HTTP 代理（如 `127.0.0.1:10809`），Python/`httpx` 可能把对 `127.0.0.1:8000` 的请求也送进代理，表现为健康检查 **503 空响应**。

联调后端时建议：

```powershell
$env:NO_PROXY = "127.0.0.1,localhost"
conda activate chatbot
cd backend
python main.py
```

浏览器访问前端一般不受影响（本机回环常被排除）；`backend/scripts/e2e_smoke.py` 已使用 `trust_env=False` 避开该问题。

---

## 5. 相关文档

| 文档 | 内容 |
|------|------|
| [`backend/README.md`](../backend/README.md) | 后端 API 与启动 |
| [`frontend/README.md`](../frontend/README.md) | 前端启动 |
| [`directory-structure.md`](./directory-structure.md) | 目录与 `.env` 约定 |
| [`backend/docs/guide/rules.md`](../backend/docs/guide/rules.md) | 后端硬规则（Key 不上前端等） |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | CI：`pytest` + frontend build |

本地与 CI 一致的后端测试：

```powershell
conda activate chatbot
cd backend
pip install -e ".[dev]"
pytest -q
```

---

## 6. Git：哪些该提交 / 不该提交

**应提交（源码与约定）**

| 路径 | 说明 |
|------|------|
| `frontend/src/`、`frontend/public/`、`package.json`、`package-lock.json`、`.env.example` | 正式前端 |
| `backend/src/`、`backend/tests/`、`backend/scripts/`、`pyproject.toml`、`.env.example` | 正式后端 |
| `docs/`、根 `README.md`、`demo/` | 文档与产品壳对照 |
| `.trellis/tasks/`、`.trellis/spec/` | 协作任务与规格 |

**不要提交（本地 / 密钥 / 构建产物）**

| 路径 | 原因 |
|------|------|
| `backend/.env`、`frontend/.env` | 含本地配置或 LLM Key |
| `node_modules/`、`frontend/dist/`、`dist/`、`build/` | 依赖与构建产物，可再生成 |
| `backend/.venv/`、`__pycache__/`、`.pytest_cache/`、`*.egg-info/` | 本地 Python 环境与缓存 |
| `backend/data/*.db`、`backend/resource/logs/` | 运行时数据库与审计日志 |
| `.vscode/settings.json` | 本机编辑器偏好（根 `.gitignore` 已忽略） |
| `vendor/*`（除 README） | 第三方参考，本仓不推送 |

克隆后按本文 §1–§3 重建环境即可；勿把本机 `.env` 或 `dist` 推上远程。
