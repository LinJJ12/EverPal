<p align="center">
  <img src="frontend/public/brand/logo.png" alt="玖伴" width="128" />
</p>

<h1 align="center">玖伴</h1>

<p align="center"><b>九久相伴，永远有人回应</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/Vue-3.5+-brightgreen" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-red" alt="FastAPI 0.115+" />
  <img src="https://img.shields.io/badge/Node.js-18+-informational" alt="Node.js 18+" />
</p>

<p align="center">
  面向小学生与初中生的 AI 陪伴助手：温暖卡通 Web、零配置、未成年人统一体验。<br />
  不做登录、不做恋爱角色、不做成人模式；安全靠提示词 + 规则词库（可选第三方入站审核）。
</p>

---

## 做什么

```
打开即可聊 → 选伙伴 → 流式陪伴 →（可选）说话 / 百科 / 心情 / 故事 / 小游戏
              ↓
         词库安全 → 可选审核 → LLM → 出站闸门 → 记忆 / 历史月历
```

正式联调：`frontend/` + `backend/`。`demo/` 仅作无后端产品壳对照。

### 核心能力

| 能力 | 说明 |
|------|------|
| 陪伴对话 | 流式回复、停止 / 重生成、话题卡、会话隔离 |
| 官方伙伴 | 小暖 / 跳跳 / 阿茶（≥3）；统一未成年人策略 |
| 语音 | 底栏「说话」+ 气泡朗读；百炼优先，浏览器回退 |
| 心情 / 记忆 | 今日心情门闸；记忆查看、改签、单条删除 |
| 故事 / 话题 | 官方 packs；空态话题卡 + `/scenes` 短故事 |
| 历史 | 月历（对话日 + 心情） |
| 游戏 | 本地离线大厅 **12 款** |
| 联网百科 | 显式「百科」→ 中文维基；相关性门控；可折叠来源 |
| 审核（可选） | 阿里云入站文本审核；默认关；fail-open |

---

## 系统架构

```
玖伴
├── frontend/          Vue 3 + Vite（卡通 UI、SSE 聊天、语音、游戏大厅）
├── backend/           FastAPI 陪伴 BFF
│   ├── services/chat  唯一编排：安全 → 审核? → wiki? → 人设 → LLM → 出站闸门
│   ├── capabilities/  persona · memory · safety · wiki · moderation · speech · llm
│   └── storage/       档案 / 会话 / 心情 / 历史（SQLite）
├── demo/              HTML 产品壳对照（不接真模型）
└── docs/              PRD · 目录约定 · 联调说明
```

Key 只放 `backend/.env`，前端不持模型密钥。

---

## 快速开始

**环境**：Conda **`chatbot`**（Python ≥3.11）+ Node.js 18+。完整说明见 [`docs/dev-setup.md`](docs/dev-setup.md)。

```powershell
# 终端 1 — 后端
conda activate chatbot
cd backend
pip install -e ".[dev]"
copy .env.example .env
# 编辑 .env：至少填 LLM_API_KEY（可先 ALLOW_MOCK_LLM=true 做无 Key 联调）
python main.py

# 终端 2 — 前端
cd frontend
npm install
npm run dev
```

打开：**http://localhost:5173**

| 地址 | 说明 |
|------|------|
| `/` · `/welcome` | 欢迎 / 回访 |
| `/chat` | 陪伴聊天（流式） |
| `/companions` | 伙伴 |
| `/history` | 历史月历 |
| `/memory` | 记忆 / 心情 |
| `/scenes` | 场景与短故事 |
| `/games` | 游戏大厅 |
| `/settings` | 本机设置（无 API Key UI） |

无后端对照：浏览器打开 `demo/index.html`。

### 测试

```powershell
# 后端
conda activate chatbot
cd backend
pytest -q

# 前端
cd frontend
npm run build
# 游戏冒烟：npm run test:games
```

推送 / PR 时 GitHub Actions 会跑 backend `pytest` + frontend `build`（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。

---

## 目录

| 路径 | 内容 |
|------|------|
| `frontend/` | 正式 Web（Vue） |
| `frontend/src/content/` | 官方话题 / 短故事 / 开场白 |
| `frontend/public/games/` | 游戏对局静态页 |
| `backend/` | 陪伴 BFF（FastAPI） |
| `demo/` | HTML 产品壳对照 |
| `demo/assets/brand/` | 品牌图标 |
| `docs/` | PRD、架构图、目录约定、联调 |
| `.trellis/` | Trellis 规格与工作流 |
| `vendor/` | 第三方参考（本地，勿当运行时） |

---

## 环境变量

写在 `backend/.env`（勿提交）。模板：`backend/.env.example`。

| 变量 | 用途 |
|------|------|
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | OpenAI 兼容聊天 |
| `ALLOW_MOCK_LLM` | 无 Key 时本地假流式（仅开发） |
| `DASHSCOPE_API_KEY` 等 | 百炼 TTS / ASR（可选；空则浏览器语音） |
| `WIKI_*` | 联网百科（默认开） |
| `MODERATION_*` | 阿里云入站审核（默认关；AccessKey 与百炼 Key 分开） |

前端仅需按需配置 `VITE_API_BASE_URL`（默认指向本地后端）。

---

## 当前阶段

- **一期**：feature-complete（内部测试，非对外发布）
- **二期近程**：语音、心情/记忆、故事、会话隔离、月历、游戏、百科、可选审核 — 已交付
- **另阶段**：登录 / 家庭账号、家长同意与面板
- **发布前欠账**：Docker / 试用包、系统化安全抽检报告

详情：[`docs/PRD.md`](docs/PRD.md) §4.2 · [`.trellis/spec/guides/product-constraints.md`](.trellis/spec/guides/product-constraints.md)

> Demo 游戏大厅可能仍为早期款数；**以 `frontend/public/games/` 为准**。

---

## 文档

- [产品需求 PRD](docs/PRD.md)
- [流程 / 架构图](docs/diagrams.md)
- [目录与分层约定](docs/directory-structure.md)
- [本地开发 / Conda](docs/dev-setup.md)
- [后端说明](backend/README.md)
- [前端说明](frontend/README.md)

---

## 许可与贡献

私有仓库。改需求请先对照 `docs/PRD.md` 与 `.trellis/spec/guides/product-constraints.md`。
