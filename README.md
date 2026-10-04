<div align="center">

<img src="frontend/public/brand/logo.png" alt="玖伴 Everpal" width="128" />

# 玖伴 · Everpal

**九久相伴，永远有人回应**

面向小学生与初中生的 AI 陪伴助手 · 温暖卡通 Web · 零配置开箱即用

[![CI](https://github.com/LinJJ12/everpal/actions/workflows/ci.yml/badge.svg)](https://github.com/LinJJ12/everpal/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-red)
![Vue](https://img.shields.io/badge/Vue-3.5+-brightgreen)
![Node](https://img.shields.io/badge/Node.js-18+-informational)

</div>

---

玖伴是一个为未成年人设计的 AI 陪伴 Web 应用：孩子打开就能和官方伙伴流式聊天，
还可以说话、查百科、记心情、玩离线小游戏。**不做登录、不做恋爱角色、不做成人模式**；
内容安全靠本地词库 + 流式输出闸门兜底，并支持可选的第三方入站审核。

> 设计原则：**未成年人统一体验**。全站单一 child 模式，任何输入都无法切换出成人内容。

## ✨ 功能特性

| 能力 | 说明 |
|------|------|
| 💬 陪伴对话 | 流式回复、停止 / 重新生成、话题卡、会话隔离与服务端持久化 |
| 🧸 官方伙伴 | 小暖 / 跳跳 / 阿茶，各自人设，统一未成年人安全策略 |
| 🎙️ 语音 | 底栏「说话」+ 气泡朗读；百炼 TTS/ASR 优先，浏览器语音兜底 |
| 🌤️ 心情 / 记忆 | 每日心情签到门闸；规则化记忆抽取 + 去重 +「帮我记住」；喜好同步档案 |
| 📖 故事 / 话题 | 官方内容包；空态话题卡与情境短故事 |
| 📅 历史月历 | 按月查看对话日与当日心情 |
| 🎮 游戏大厅 | **12 款**本地离线小游戏（贪吃蛇、2048、五子棋、俄罗斯方块…） |
| 🌏 联网百科 | 显式点击「百科」才检索中文维基；口语词映射 + 相关性门控 + 可折叠来源 |
| 🛡️ 内容安全 | 词库输入检查 → 可选第三方审核 → LLM → 流式输出闸门，全链路留审计日志 |
| 🔒 部署加固 | 付费端点限流、请求体上限、CORS 白名单、非 root 容器、nginx 安全头 |

## 🏗️ 系统架构

```
玖伴 / Everpal
├── frontend/          Vue 3 + Vite（卡通 UI、SSE 聊天、语音、游戏大厅）
├── backend/           FastAPI 陪伴 BFF
│   ├── src/services/chat   唯一编排：安全 → 审核? → wiki? → 人设 → LLM → 出站闸门
│   ├── src/capabilities/   persona · memory · safety · wiki · moderation · speech · llm
│   ├── src/data/           lexicon（安全词库）· wiki/lemma_map（口语检索词）
│   ├── src/storage/        档案 / 会话 / 心情 / 历史（SQLite，WAL）
│   └── prompts/            伙伴与模式系统提示词
├── demo/              无后端产品壳对照（不接真模型）
├── deploy/            nginx 反代配置
└── docs/              PRD · 架构图 · 部署与联调文档
```

一次聊天请求的完整链路：

```
输入词库检查 → (可选)第三方入站审核 → (可选)百科检索 → 人设 + 记忆 → LLM 流式
    → 流式输出闸门（逐窗词库检查，命中即软拒绝） → 会话持久化 + 记忆抽取 → 审计日志
```

> 模型 API Key 只存放在 `backend/.env`，前端永不持有密钥。

## 🚀 快速开始

### 方式一：Docker 一键部署（推荐）

单入口 **http://localhost:8080**（局域网内可用 `http://<本机IP>:8080` 访问）。

```bash
# 1. 准备后端环境变量（至少填入 LLM_API_KEY，OpenAI 兼容接口）
cd backend
cp .env.example .env        # Windows 下用 copy
# 编辑 .env：LLM_API_KEY=sk-...

# 2. 启动
cd ..
docker compose up --build
```

打开 **http://localhost:8080** 即可。`web` 容器会等待 `api` 健康检查通过后自动启动，
更多说明见 [docs/docker.md](docs/docker.md)。

> ⚠️ **安全提示**：产品定位为无登录的家庭/校园内网部署，请勿将端口直接暴露公网。
> 部署清单：填写真实 `LLM_API_KEY`（不要开 `ALLOW_MOCK_LLM`）、建议启用第三方审核、置于反代/防火墙之后。

### 方式二：本地开发

环境要求：Python **3.11+**（建议 Conda 环境 `chatbot`）、Node.js **18+**。
完整说明见 [docs/dev-setup.md](docs/dev-setup.md)。

```bash
# 终端 1 — 后端（http://127.0.0.1:8000）
conda activate chatbot
cd backend
pip install -e ".[dev]"
cp .env.example .env
# 编辑 .env：可先设 ALLOW_MOCK_LLM=true 做无 Key 联调
python main.py

# 终端 2 — 前端（http://localhost:5173）
cd frontend
npm install
npm run dev
```

无后端的纯前端对照：直接浏览器打开 `demo/index.html`。

### 页面一览

| 路由 | 说明 |
|------|------|
| `/` · `/welcome` | 欢迎页 / 回访页 |
| `/chat` | 陪伴聊天（SSE 流式） |
| `/companions` | 选择伙伴 |
| `/history` | 历史月历 |
| `/memory` | 记忆 / 心情面板 |
| `/scenes` | 情境对话与短故事 |
| `/games` | 离线游戏大厅（12 款） |
| `/settings` | 本机设置（无任何 API Key 输入项） |

## ⚙️ 配置说明

全部后端配置写在 `backend/.env`（不会提交），模板见 [`backend/.env.example`](backend/.env.example)。

| 变量 | 用途 |
|------|------|
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | OpenAI 兼容聊天模型（必填 Key） |
| `ALLOW_MOCK_LLM` | 无 Key 时本地假流式，**仅限开发** |
| `LLM_MAX_TOKENS` | 单次回复 token 上限（默认 1024，控制成本） |
| `RATE_LIMIT_ENABLED` / `RATE_LIMIT_PER_MINUTE` | 付费端点按 IP 限流（默认开，40 次/分钟） |
| `DASHSCOPE_API_KEY` | 百炼 TTS / ASR（可选；留空回退浏览器语音） |
| `WIKI_*` | 中文维基百科检索（默认开） |
| `MODERATION_*` | 阿里云内容安全入站审核（默认关；建议生产开启） |
| `CORS_ORIGINS` | 允许的跨域来源白名单（逗号分隔；为空则仅允许同源） |

前端仅需要 `VITE_API_BASE_URL`（默认指向本地后端，生产同源部署留空）。

## 🧪 测试

```bash
# 后端单元 / 接口测试
cd backend
pytest -q

# 前端类型检查 + 构建
cd frontend
npx vue-tsc --noEmit
npm run build

# 游戏逻辑冒烟
npm run test:games
```

推送与 PR 会由 GitHub Actions 自动执行后端 `pytest` 与前端 `build`
（见 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。

## 📁 项目结构

| 路径 | 内容 |
|------|------|
| `frontend/` | 正式 Web（Vue 3 + TypeScript） |
| `frontend/src/content/` | 官方话题 / 短故事 / 开场白 |
| `frontend/public/games/` | 12 款离线小游戏静态页 |
| `backend/` | 陪伴 BFF（FastAPI） |
| `backend/src/data/` | 安全词库、百科口语词映射 |
| `backend/prompts/` | 伙伴人设与模式提示词 |
| `demo/` | HTML 产品壳对照（不接真模型） |
| `docs/` | PRD、架构图、部署与安全文档 |
| `deploy/nginx.conf` | nginx 反代（SSE 直通 + 安全头） |
| `docker-compose.yml` | 单入口 Compose（api + web，:8080） |

## 🛡️ 安全与隐私

作为一个面向未成年人的产品，安全不是附加项，而是默认行为：

- **三层内容防护**：本地词库（输入 + 流式输出窗口闸门）→ 可选第三方入站审核 → 出站软拒绝；
  全部拦截写入审计日志（`backend/resource/logs/`）。
- **最小数据**：无账号体系；`client_id` 仅为本机生成的高熵设备标识，
  服务端按其隔离会话 / 记忆 / 心情数据。
- **密钥隔离**：模型密钥只存在于 `backend/.env` 或容器环境变量，前端打包产物不含任何密钥。
- **滥用防护**：付费上游端点（聊天 / TTS / ASR）按 IP 滑动窗口限流；请求体大小封顶；
  聊天 `max_tokens` 封顶单次成本。
- **提示词防线**：昵称 / 喜好等进入系统提示词的字段统一过词库净化并截断。
- **容器加固**：后端容器以非 root 用户运行；nginx 关闭版本号并附加安全响应头。

历史安全抽检与 LLM 行为清单见 [docs/safety-audit-report.md](docs/safety-audit-report.md)。

## 🗺️ 路线图

- [x] 一期：陪伴对话、官方伙伴、语音、心情/记忆、故事、历史月历、游戏大厅
- [x] 联网百科（口语 lemma + 相关性门控 + 来源折叠）
- [x] 安全抽检自动化基线 + 三人设/话题包打磨（18/18 LLM 行为清单通过）
- [x] Docker 单入口试用包 + 部署加固（限流 / 非 root / 安全头）
- [ ] 登录 / 家庭账号、家长同意与家长面板
- [ ] 向量记忆（当前为规则抽取）
- [ ] 语音对话模式（连续对话）

产品约束详见 [docs/PRD.md](docs/PRD.md)。

## 🤝 参与贡献

欢迎 issue 与 PR！

1. Fork 本仓库并创建特性分支（`git checkout -b feat/your-feature`）
2. 开发时请对照 [docs/PRD.md](docs/PRD.md) 与 [docs/directory-structure.md](docs/directory-structure.md)
3. 提交前请确保 `pytest`、`vue-tsc --noEmit` 与 `npm run build` 全部通过
4. 提交信息遵循 Conventional Commits（`feat:` / `fix:` / `chore:` / `docs:`）

涉及未成年人安全的改动（词库、提示词、闸门逻辑）请额外说明影响面，
并补充对应的回归测试。

## 📚 文档

- [产品需求 PRD](docs/PRD.md)
- [安全抽检报告](docs/safety-audit-report.md)
- [流程 / 架构图](docs/diagrams.md)
- [目录与分层约定](docs/directory-structure.md)
- [本地开发 / Conda](docs/dev-setup.md)
- [Docker 部署](docs/docker.md)
- [后端说明](backend/README.md) · [前端说明](frontend/README.md)

## 📄 许可证

本项目以 [Apache License 2.0](LICENSE) 开源发布。

- 允许商用、修改、再分发；附带**明确专利授权**，并要求保留版权与许可证声明。
- 修改文件时请按许可证 §4(b) 携带变更说明。
- 向本项目提交 issue、PR 或其他形式的贡献，即表示同意该贡献以 Apache-2.0 随项目发布。
