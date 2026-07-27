# 玖伴 · 仓库目录与文件约定

> **目的**：每个文件夹/文件用一句话说清「只负责什么、禁止什么」，方便后期加功能而不搅成泥球。  
> **依据**：[`docs/PRD.md`](./PRD.md) v0.5.5。  
> **结构借鉴**：本机旁路仓 **OmniStream**（与本仓库并列，例如桌面上的 `OmniStream/`；**不在本 Git 仓库内**）的前后端分离、`api` 垂直对齐、编排 vs 单能力分层、目录 README 所有权；**业务内容按陪伴 PRD，不照搬直播带货模块**。克隆本仓的协作者无需、也无法依赖该路径。  
> **命名**：正式根目录为 `frontend/`、`backend/`（不用 `web/`、`server/`）。

---

## 0. 从 OmniStream 借鉴什么（摘要）

| 优点 | 在玖伴怎么用 |
|------|----------------|
| 仓库根只放跨端文档；业务在 `frontend/` / `backend/` | 同左；`demo/` 仅作体验对照 |
| 前端 **`src/api/` 唯一发 HTTP**；按后端资源切文件 | 同左；禁止在页面里裸 `fetch` |
| **前后端 API 垂直表**（改接口同表更新） | 见 §3 |
| 后端：**api → 编排 → 单能力 → storage**；LLM 只出自 `config` | 陪伴一期编排很薄：仅 `services/chat`（聊天管线）；人设/记忆/安全/LLM 进 `capabilities/` |
| 每层 **一句话职责 + 禁止**；`lib/` 白名单 | 见 §4 / §5 |
| 脚手架后 **每层 README** 为协作入口 | 见 §7；未建代码前以本文为准 |
| `.env.example` 提交、`.env` 不提交；Key 只在后端 | 见 §1.1 |
| 不预建用不到的空目录 | 不做 `agent/`、家长空壳；浏览器语音在 `components/voice`；云端语音在 `backend/src/capabilities/speech` |

**刻意不照搬**：OmniStream 的 `pipeline/`（多步 Job）与 `agent/`（多轮工具）——玖伴 MVP 聊天是「单次流式管线」，用 `services/chat.py` 一条编排即可；日后若出现「固定多步后台 Job」再开 `pipeline/`。

---

## 1. 仓库顶层

```text
chatbot/
├── README.md                 # 产品简介 + 如何打开
├── docs/                     # 跨端需求/架构（给人看）
├── demo/                     # HTML 产品壳对照（不接真模型）
├── frontend/                 # 正式 Web 前端
├── backend/                  # 陪伴 BFF
├── vendor/                   # 第三方参考（只读，非运行时）
├── .trellis/                 # 规格与任务
├── .gitignore                # 忽略 `.env`；放行 `!.env.example`
└── docker-compose.yml        # 可选：本地起 backend
```

| 路径 | 一句话职责 | 禁止 |
|------|------------|------|
| `docs/` | 产品与架构真相（PRD、本约定、图） | 运行时代码、密钥 |
| `demo/` | 已验证的卡通壳对照体验 | 真 API Key、当生产主路径 |
| `frontend/` | 界面、本机状态、调 BFF | 持有 LLM Key、词库/提示词主逻辑 |
| `backend/` | 聊天管线、安全、人设、LLM 代理、持久化 | 页面组件、卡通 CSS |
| `vendor/` | 参考实现摘录 | `import` 进生产路径 |
| `.trellis/` | AI/研发协作规格 | 产品运行时资源 |

### 1.1 环境变量（`.env`）

```text
frontend/
├── .env.example     # ✅ Git：仅 VITE_API_BASE_URL 等
├── .env             # ❌ Git：本地地址覆盖；禁止 LLM Key
backend/
├── .env.example     # ✅ Git：变量名 + 空占位
├── .env             # ❌ Git：真实 LLM_API_KEY 等
demo/                # 不需要 .env
# 仓库根：不要放含 Key 的 .env
```

**`backend/.env.example` 推荐键**

```bash
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT_SECONDS=60
DATABASE_URL=sqlite:///./data/companion.db
# 百炼语音（空则前端回退浏览器 Web Speech）
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_COMPAT_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
TTS_MODEL=qwen-audio-3.0-tts-flash
ASR_MODEL=qwen3-asr-flash
```

**`frontend/.env.example`**

```bash
VITE_API_BASE_URL=http://localhost:8000
```

根 `.gitignore` 已忽略 `.env` / `.env.*` 并放行 `!.env.example`。Docker 用 `env_file: backend/.env`，勿把 Key 写进已提交的 compose。

**Python 虚拟环境**：本仓库后端统一用 Conda 环境名 **`chatbot`**（勿默认再建 `backend/.venv`）。步骤见 [`docs/dev-setup.md`](./dev-setup.md)。

---

## 2. 分层心智（先懂再找文件）

### 2.1 前端（比后端简单）

前端**不做**陪伴管线编排；编排在后端。

```text
views（页面）
  → composables（本页交互：调 api、写 store、控 UI）
      → api（唯一 HTTP）  →  backend
      ↘ stores（跨页：模式、当前角色、流式状态等）
views / composables → components（跨页可复用 UI）
```

| 层 | 一句话 | 禁止 |
|----|--------|------|
| `views/` | 一界面一目录；模板与绑定 | 裸 `fetch`；堆业务算法 |
| `composables/` | 页级/可复用交互：`useXxxPage` 与 `views/<name>` 对应 | 直接操作无关页的 DOM；绕过 `api` 请求 |
| `api/` | 唯一对后端发请求；按资源切文件 | 改 DOM；写入全局 store；伪造流式进度 |
| `stores/` | 跨页状态 | 发 HTTP（应经 `api`） |
| `components/` | 跨页 UI 块 | 藏页面路由级逻辑 |
| `themes/` | 卡通皮肤 tokens | 业务判断 |
| `content/` | 官方话题 / 场景 / 短故事 / 开场白等静态内容包 | HTTP；散落在多处 view 各写一份 |
| `lib/` / `utils/` | 无业务语义小工具 | 聊天/安全/人设逻辑；产品文案内容包 |

### 2.2 后端（两轴）

| 轴 | 含义 | 落点 |
|----|------|------|
| **界面轴（对外）** | 前端有哪些能力入口，HTTP 就怎么切 | `api/` |
| **编排轴（对内）** | 聊天必须按固定顺序走安全与人设 | `services/chat`（一期唯一编排） |

```text
前端
  │
  ▼
api/                            # 只做 HTTP：校验 → 选入口 → 返回/流式写出
  ├─ 流式聊天 ─────────────────► services/chat.py     # 管线顺序（唯一）
  └─ 简单 CRUD ────────────────► capabilities/* 或 storage/
                                      │
                                      ▼
                                capabilities/         # persona / memory / safety / llm / wiki / speech
                                      │
                                      ▼
                                storage/ + domain/ + config/ + prompts/ + data/lexicon/

横切：lib/（日志、统一异常）——不得反向依赖上层，不得塞业务
LLM 客户端：只出自 config/（capabilities/llm 经 config 取客户端）
```

---

## 3. 前后端 API 垂直对应（改接口必改此表）

| 用户能力（PRD） | 前端 `src/api/` | 后端 `src/api/` | 默认下一层 |
|-----------------|-----------------|-----------------|------------|
| 探活 | （可选）`http` 健康 | `health` | — |
| 角色列表 | `companions.ts` | `companions` | `capabilities/persona` 或静态 prompts 元数据 |
| 流式陪伴对话 | `chat.ts` | `chat` | **`services/chat`**（可含 `capabilities/wiki` 摘要注入；`done.sources`） |
| 会话列表/保存/回看 | `sessions.ts` | `sessions` | `storage` |
| 历史月历（对话日+心情） | `history.ts` | `history` | `storage/history_repo`（消息日 UTC+8；稀疏 days） |
| 档案 / 记忆查看清除 | `profile.ts` | `profile` | `capabilities/memory` + `storage` |
| 今日心情 | `mood.ts` | `mood` | `storage/mood_repo`（按日；注入 memory snippet） |
| 语音朗读 / 听写 | `speech.ts` | `speech` | **`capabilities/speech`**（云端；前端浏览器回退） |

```text
frontend views → composables → frontend/src/api/*  →  HTTP /v1/...
backend api → services/chat | capabilities → storage / domain / config
```

建议路径：`GET /health`，`GET /v1/companions`，`POST /v1/chat/stream`，`/v1/sessions`，`GET /v1/history/calendar`，`GET /v1/history/days/{day}/sessions`，`/v1/profile`，`GET|PUT /v1/mood/today`，`POST /v1/speech/tts`，`POST /v1/speech/asr`。  
**禁止对公网**：模型管理台、温度调试、原始 Provider 错误体、百炼 Key。

---

## 4. 前端 `frontend/` 目录与文件

框架任选（Vue 与 OmniStream 一致较省事；React 亦可）。**目录语义固定**；后缀随框架（`.vue` / `.tsx`）。

```text
frontend/
├── package.json
├── .env.example
├── .env                          # gitignore
├── index.html
├── public/
│   ├── brand/logo.png
│   └── games/                    # 本地小游戏静态页（由 /games 大厅进入；见其 README）
│       ├── {id}.html + js/{id}.js
│       ├── games-common.js / store.js / games.css / cartoon.css
│       └── README.md             # 新增游戏检查清单
├── scripts/
│   └── games/                    # smoke-check / playtest（非站点资源）
├── README.md                     # 工程怎么起
├── src/
│   ├── README.md                 # 前端分层入口
│   ├── main.ts
│   ├── App.vue                   # 根壳：顶栏；无模型配置入口
│   ├── router/
│   ├── api/                      # 【关键】唯一 HTTP
│   │   ├── http.ts               # baseURL、错误 → 人话
│   │   ├── chat.ts
│   │   ├── companions.ts
│   │   ├── sessions.ts
│   │   ├── profile.ts
│   │   ├── mood.ts               # 今日心情 GET/PUT（仅 HTTP）
│   │   ├── history.ts            # 月历 / 当日会话（仅 HTTP）
│   │   └── speech.ts             # TTS / ASR HTTP（无 Key）
│   ├── views/                    # 一界面一目录
│   │   ├── home/                 # 品牌首页（shell-hero）           UI-01
│   │   ├── welcome/              # 欢迎 / 回访                      CMP-01
│   │   ├── profile/              # 昵称 + 喜好                      MEM-01/02
│   │   ├── companions/           # ≥3 官方角色；无恋爱               PER-01, CMP-07
│   │   ├── scenes/               # 场景 + 短故事入口 → chat seed（读 content/packs）
│   │   ├── chat/                 # 流式聊 / 停止 / 话题卡 / 语音 / 百科来源折叠     CMP-02~05, UI-06, 百科
│   │   ├── history/              # 月历：对话日 + 心情               UI-02
│   │   ├── memory/               # 记忆查看 / 清除 / 今日心情        MEM-03
│   │   ├── settings/             # 本地设置；无 API Key UI           UI-04
│   │   ├── games/                # 益智游戏大厅（读 utils/gamesMeta）
│   │   └── safety/               # 安全边界示例入口
│   ├── content/
│   │   ├── packs.ts                  # 话题 / 场景 / 短故事唯一内容源
│   │   └── openers.ts                # 伙伴空态开场白
│   ├── composables/
│   │   ├── useChatPage.ts
│   │   ├── useChatStream.ts          # SSE；解析可选 sources（维基白名单）
│   │   ├── useChatSession.ts         # 会话加载 / 伙伴切换 / bootstrap
│   │   ├── useChatSpeak.ts           # 气泡朗读控制
│   │   ├── useMoodGate.ts            # /chat 今日心情门闸 + 延后 bootstrap
│   │   ├── useTopicCards.ts          # 空态话题卡（读 content/packs）
│   │   ├── useHistoryCalendar.ts     # /history 月历数据与翻月
│   │   ├── useSpeechRecognition.ts   # 浏览器 STT 回退
│   │   └── useSpeechSynthesis.ts     # 云端 TTS 优先 + 浏览器回退
│   ├── components/
│   │   ├── layout/               # AppHeader（NAV_PRIMARY + 更多）
│   │   ├── chat/                 # Bubble、Composer（含「百科」开关）、TopicCards、ChatSources
│   │   ├── voice/                # VoiceTalkButton（点我说话）
│   │   ├── mood/                 # MoodGate / MoodSticker / moodOptions
│   │   └── companions/           # CompanionAvatar
│   ├── stores/
│   ├── themes/cartoon/           # cartoon.css + mood.css + chat.css（含来源折叠）+ history.css + games.css
│   ├── types/                    # 含 ChatSource（维基引用）
│   └── utils/
│       ├── avatars / clientId / errors / activeSession / chatSidebar / timeCn / gamesMeta
│       └── voice/                # browser · companionVoice · mediaRecorder · speakProgress
└── tests/
```

### 4.1 前端放置细则

| 类型 | 放这里 | 不要放这里 |
|------|--------|------------|
| 路由整页 | `views/<name>/` | `components/` |
| 本页私有小组件 | `views/<name>/components/` | 过早丢进全局 `components/` |
| 跨页 UI | `components/*` | 复制进多个 view |
| HTTP | `api/*` | view / composable 内 `fetch` |
| 跨页状态 | `stores/*` | 到处 `localStorage` 无封装 |
| 本机持久化辅助 | `stores` 或薄 `utils/storage.ts` | 与 API 混在同一文件且职责不清 |
| 皮肤 | `themes/cartoon/` | 组件内散落 hex |
| 官方话题 / 场景 / 故事 / 开场白 | `content/packs.ts`、`content/openers.ts` | `api/`、`avatars.ts`、多 view 各写一份 |
| 本机会话指针 / 侧栏偏好 | `utils/activeSession.ts`、`utils/chatSidebar.ts` | view 内散落 `localStorage` |
| 百科来源折叠 UI | `components/chat/ChatSources.vue` | view 内手写外链；信任模型输出的 URL |
| SSE `sources` 解析 / 白名单 | `composables/useChatStream.ts`（`parseChatSources`） | 在 view 里解析；放行非维基主机 |
| 用户可见错误文案 | `api/http` 映射或 `utils/errors.ts` | 直接上屏 `error.message` |

### 4.2 前端硬约束

1. 无 `LLM_*` / `OPENAI_API_KEY` 进入前端环境变量。  
2. 词库拦截、提示词组装、温和拒答主逻辑在后端。  
3. 产品 UI 无 Tour / PRD 版本 /「不接真实大模型」。  
4. 益智游戏：大厅在 `views/games/`（列表来自 `utils/gamesMeta.ts`）；对局页在 `public/games/`。新增游戏须同步 `gamesMeta` + `games-common.js` META + `store.js`。`demo/games/` 仅作历史对照，可能落后，**以 public/games 为准**。  
5. 语音分层：`api/speech.ts`（HTTP）→ composables → `components/voice/`；浏览器辅助在 `utils/voice/`。云端优先、浏览器回退；转写进 composer → 现有发送管线。无成人模式页（`/mode` 仅重定向）。
6. 今日心情：`api/mood.ts`（HTTP）+ `components/mood/moodOptions.ts`（UI 常量）+ `useMoodGate`（门闸）；`MoodGate` 每日首次进 `/chat`；写入后端后由 `memory.snippet` 注入系统提示；记忆页可改签与单条删除。
7. 历史月历：`api/history.ts` + `useHistoryCalendar`；周一起始公历；对话日按消息东八区日；无农历。
8. 会话隔离：切换伙伴 / 「新建对话」清空当前屏与 active session；旧线程仅从历史 `?session=` 进入。场景 / 安全 `?seed=` 须同时清 `store.sessionId` 与 `utils/activeSession`。
9. 聊天侧栏展开偏好：`utils/chatSidebar.ts`（勿在 `ChatView` 内直接读写 localStorage）。
10. 联网百科：输入栏 **「百科」** 按钮（`ChatComposer` + `wikiMode`）；请求带 `use_wiki`；仅此时后端检索。发送时立即熄灭（一次一问）；切换伙伴 / 加载会话 / 新建对话会 `resetWikiMode`。重新生成若原回复带 sources 则再次 `useWiki`。来源仅 SSE `done.sources` + `parseChatSources` 白名单；UI 为 `ChatSources.vue`。

---

## 5. 后端 `backend/` 目录与文件

```text
backend/
├── pyproject.toml | requirements.txt
├── main.py                       # 进程入口（创建 app / uvicorn）
├── .env.example
├── .env                          # gitignore
├── README.md
├── docs/                         # 后端专属说明（脚手架后可加 guide/rules.md）
├── data/                         # 业务真相源（sqlite 等；gitignore 运行时文件）
├── resource/                     # logs / cache / tmp（非业务真相）
├── tests/
│   ├── unit/                     # 与 capabilities / services 同构
│   ├── api/                      # HTTP TestClient
│   └── fixtures/safety_cases.json
└── src/
    ├── README.md                 # 后端分层入口
    ├── api/                      # HTTP：按前端能力垂直切分
    │   ├── health.py
    │   ├── chat.py               # 流式；调用 services.chat
    │   ├── companions.py
    │   ├── sessions.py
    │   ├── history.py            # 月历 / 当日会话聚合              UI-02
    │   ├── profile.py
    │   ├── mood.py               # 今日心情 GET/PUT                    P1
    │   └── speech.py             # TTS / ASR 代理                     UI-06
    ├── services/
    │   └── chat.py               # 【一期唯一编排】管线顺序见下
    ├── capabilities/             # 被编排的单能力（可调 LLM，经 config）
    │   ├── persona.py            # 角色 + 未成年人提示合并           PER-*
    │   ├── memory.py             # 轻量记忆片段                       MEM-*
    │   ├── safety.py             # 入站/出站词库 + 拒答               SAF
    │   ├── llm.py                # OpenAI 兼容流式                    CMP-02
    │   ├── wiki/                 # 联网百科：按钮触发；MediaWiki 摘要（含意图/查询扩展）
    │   │   ├── intent.py         # 查询扩展（非自动触发）
    │   │   ├── hosts.py          # Wikipedia HTTPS 主机白名单
    │   │   ├── client.py
    │   │   ├── lookup.py         # maybe_lookup(force=…)；仅 chat 在 use_wiki 时调用
    │   │   └── README.md
    │   └── speech/               # 百炼语音包（见包内 README）         UI-06
    │       ├── client.py         # Key / HTTP / URL allowlist
    │       ├── tts.py
    │       └── asr.py
    ├── prompts/                  # 纯文本提示词（便于 diff）
    │   ├── modes/child.md
    │   ├── companions/nuan.md | tiao.md | cha.md
    │   └── safety/               # 可选危机附加
    ├── data/
    │   └── lexicon/              # 词库 JSON（按类拆文件）
    ├── storage/                  # 只做读写与路径；禁止 LLM
    │   ├── db.py
    │   ├── profile_repo.py
    │   ├── session_repo.py
    │   ├── memory_repo.py
    │   ├── mood_repo.py          # 按日心情 CRUD（UTC+8）；纯规则见 domain
    │   └── history_repo.py       # 月历聚合（消息日 + daily_moods）
    ├── domain/                   # 纯模型/枚举/规则数据；无 I/O
    │   ├── enums.py              # Mode、SafetyAction…
    │   ├── moods.py              # MOOD_IDS / normalize / labels
    │   └── time_cn.py            # 东八区日历日解析（mood / history 共用）
    ├── config/
    │   ├── settings.py           # 读 .env
    │   └── llm.py                # 【唯一】创建 LLM 客户端
    ├── schemas/                  # 请求/响应 DTO（chat / companion / speech / mood / history）
    └── lib/                      # 横切白名单：logging、exceptions
```
### 5.1 聊天管线（`services/chat.py` 专属）

与 `.trellis/spec/backend/safety-pipeline.md` 一致：

```text
api/chat
  → services/chat
       1. capabilities/safety    入站 → 硬命中则拒答（不调 LLM；优先于拼提示）
       1b. capabilities/wiki     仅当请求 use_wiki=true → 维基摘要（词库过滤；失败跳过）
       2. capabilities/persona   + prompts + memory 片段 + 可选百科块
       3. capabilities/llm       流式 token（客户端来自 config.llm）
       4. capabilities/safe_stream 窗口化出站词库闸门（先检再发给客户端；命中则温和改写）
       5. storage                落库消息 + safety_action（需 client_id）
       6. capabilities/memory    规则抽取喜好/自称等写入记忆
       附：request_id 贯穿日志；安全命中写入 resource/logs/safety_audit.jsonl
          done SSE 可带 sources（仅本回合实际注入摘要时）
```

### 5.2 后端各层一句话

| 目录 | 职责 | 禁止 |
|------|------|------|
| `api/` | HTTP 形状、鉴权占位、调用编排或能力 | 写管线步骤细节；直接 `httpx` 调模型 |
| `services/chat.py` | 固定聊天顺序、流式桥接 | 实现词库细节、拼长提示词正文 |
| `capabilities/*` | 可复用单能力（人设/记忆/安全/LLM） | 启动第二套聊天顺序；实现 agent loop |
| `prompts/**` | 提示词正文 | 业务 if/else |
| `data/lexicon/` | 词库条目 | 散落在代码字符串 |
| `storage/` | DB/文件读写 | 调 LLM；编排多步 |
| `domain/` | 枚举与纯规则 | 网络 I/O；读 env（走 `config`） |
| `config/` | 环境变量与 LLM 客户端工厂 | 业务编排 |
| `schemas/` | DTO | 副作用 |
| `lib/` | 日志、统一异常 | 任何陪伴业务概念 |
| `data/`（根下） | 运行时业务库文件 | 与 `resource/` 混放日志 |
| `resource/` | logs/cache/tmp | 当会话/记忆真相源 |

### 5.3 后端硬禁止（对齐 OmniStream 精神）

1. **`api/`** 不写安全词匹配细节，不直接创建 LLM 客户端。  
2. **`storage/`** 不调 LLM。  
3. **新功能先选已有层**；放不进再开文档讨论——**禁止默默丢进 `lib/`**。  
4. **`capabilities`** 不导入 `services`（防环）；`domain` / `lib` 不依赖上层。

---

## 6. 追加代码检查清单（协作）

1. 新接口：属于哪个**用户能力**？→ 写入 §3 表 → `frontend/src/api/X` + `backend/src/api/X`。  
2. 是否**固定多步且要统一顺序**（聊天安全管线）？→ 只扩 `services/chat`，步骤细节进 `capabilities`。  
3. 是否只是单次生成/校验？→ `capabilities`，不要新开编排目录。  
4. 读写 DB/文件？→ 只经 `storage`。  
5. 模式/角色枚举？→ `domain`。  
6. 日志/对外错误形？→ `lib`。  
7. 不确定？问「编排、单能力，还是存储？」——**不要默认进 `lib/`**。

---

## 7. 脚手架后的目录 README（所有权）

代码落地时，至少补这些入口（内容可短，但必须有「职责 / 禁止 / 邻层」）：

| 文件 | 作用 |
|------|------|
| `frontend/README.md` | 如何 `npm run dev`、环境变量 |
| `frontend/src/README.md` | 前端分层总规范 |
| `frontend/src/api/README.md` | HTTP 模块与后端对应表 |
| `backend/README.md` | 如何启动、测安全用例 |
| `backend/src/README.md` | 后端分层总规范 |
| `backend/docs/guide/rules.md` | 可选：最短硬禁止三条 |

变更某层职责时：**同 PR 更新该层 README + 本文对应小节**。

---

## 8. `demo/` 与正式目录

| | `demo/` | `frontend/` + `backend/` |
|--|---------|---------------------------|
| 用途 | 卡通壳对照 | 接真模型的可维护实现 |
| 回复 | 本地启发式 / 剧本 | BFF 管线 → LLM |
| 维护 | 体验回归；大改优先迁正式树 | 主研发路径 |

建议顺序：先 `backend` 跑通流式+安全 → `frontend/views/chat` 接 `api/chat` → 再迁其余页。

---

## 9. 二期再加（现在不要建空壳）

| 能力 | 未来落点 |
|------|----------|
| 固定多步后台 Job | 再开 `backend/src/pipeline/`（参考 OmniStream） |
| 多轮工具型智能体 | 再开 `backend/src/agent/`（非 MVP） |
| 语音（浏览器 STT/TTS） | **已交付**：`frontend` `components/voice` + speech composables（云端失败回退） |
| 语音（云端 STT/TTS） | `backend/src/capabilities/speech` + `api/speech.py`（`/v1/speech/tts`、`/asr`）；Key：`DASHSCOPE_*` |
| 家长面板 | `views/parent` + `api/parent` |
| 儿童主题皮肤变体 | `themes/` 下另议（**不做**成人向中性皮肤） |
| 登录同步 | `api/auth` + storage 账号表 |

---

## 10. 文档索引

| 文档 | 用途 |
|------|------|
| [`docs/PRD.md`](./PRD.md) | 需求 |
| [`docs/diagrams.md`](./diagrams.md) | 流程图（目录以本文为准） |
| OmniStream（本机旁路参考仓，非本仓库子目录） | 分层写法参考（不同产品）；见文首说明 |
| [`.trellis/spec/frontend/directory-structure.md`](../.trellis/spec/frontend/directory-structure.md) | 前端规格摘要 |
| [`.trellis/spec/backend/directory-structure.md`](../.trellis/spec/backend/directory-structure.md) | 后端规格摘要 |
| [`.trellis/spec/backend/safety-pipeline.md`](../.trellis/spec/backend/safety-pipeline.md) | 安全顺序 |

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-07-23 | 初版：`frontend/` + `backend/` |
| v0.2 | 2026-07-23 | §1.1 `.env` 约定 |
| v0.3 | 2026-07-23 | 借鉴 OmniStream：分层心智、API 垂直表、capabilities/services、职责禁止表、检查清单与 README 所有权 |
| v0.4 | 2026-07-23 | 修正 OmniStream 引用说明；统一 composables 与 views 命名（去掉 composables/pages） |
| v0.5 | 2026-07-25 | 新增 `frontend/src/content/`（话题/场景/短故事 packs）；scenes 页含短故事分组 |
| v0.6 | 2026-07-25 | 会话隔离约定；`content/openers`；`utils/chatSidebar`；去掉 avatars 过渡 re-export |
| v0.7 | 2026-07-27 | `capabilities/wiki` 联网百科；聊天管线 1b；SSE `sources` |
| v0.8 | 2026-07-27 | 前端树补 `ChatSources` / `useChatStream` sources；硬约束 §4.2.10 |
| v0.9 | 2026-07-27 | 百科改为显式「百科」按钮 + `use_wiki`；重置/再生成约定 |
