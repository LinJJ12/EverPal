# 玖伴（Everpal）：流程 · 思维导图 · 架构图

> 依据 `docs/PRD.md`。产品名 **玖伴** / **Everpal**（九久相伴，永远有人回应）。  
> 一期：**feature-complete（内部测）** — Web + 卡通 + 无登录 + 提示词/词库安全。  
> 二期近程：语音 → 记忆/心情 → 故事库 → 会话隔离 → 联网百科（「百科」按钮）→ 可选审核；登录/家长另阶段。  
> 下图均为 Mermaid，可在支持 Mermaid 的编辑器中预览。

---

## 1. 用户主流程

### 1.1 首次打开 → 开始陪伴（MVP）

```mermaid
flowchart TD
    A[打开 Web 页面] --> B{本地是否已有档案?}
    B -->|否| C[欢迎页：卡通形象]
    C --> D[选模式：儿童 / 成人]
    D --> E[可选：设置昵称]
    E --> F[选陪伴角色<br/>小暖 / 跳跳 / 阿茶]
    B -->|是| G[恢复昵称 + 上次角色]
    F --> H[进入聊天页]
    G --> H
    H --> I{空会话?}
    I -->|是| J[展示话题卡片<br/>听故事 / 说说今天 / 问答]
    I -->|否| K[展示历史气泡]
    J --> L[用户输入或点卡片]
    K --> L
    L --> M[发送消息]
    M --> N[流式收到回复]
    N --> O[可继续聊 / 换角色 / 回看历史]
```

### 1.2 单次发消息（含安全）

```mermaid
flowchart TD
    A[用户点击发送] --> B[前端：展示用户气泡]
    B --> C[POST /api/chat 流式请求]
    C --> D[组装上下文<br/>人设 + 模式 + 记忆 + 近期消息]
    D --> E[输入侧：规则词库检测]
    E -->|命中拦截| F[返回温和拒答/转话题文案]
    E -->|放行| G[注入 System Prompt<br/>含分龄安全约束]
    G --> H[调用 LLM Provider]
    H --> I[流式 token 回写前端]
    I --> J[输出侧：规则词库检测]
    J -->|命中| K[截断/改写为安全回复]
    J -->|放行| L[完整展示助手气泡]
    F --> M[可选写入会话<br/>标记 safety_action=block]
    K --> M
    L --> N[异步：更新偏好记忆摘要]
    M --> O[结束本轮]
    N --> O
```

### 1.3 儿童模式 vs 成人模式（决策分支）

```mermaid
flowchart LR
    A[用户消息] --> B{当前模式}
    B -->|儿童| C[短句 / 浅话题 / 严词库]
    B -->|成人| D[可树洞倾诉 / 共情优先 / 常规词库]
    C --> E[禁止恋爱暧昧 / 危险挑战等]
    D --> F[禁止恋爱角色玩法<br/>允许轻度倾诉]
    E --> G[生成回复]
    F --> G
```

### 1.4 版本演进路线（产品流程视角）

```mermaid
flowchart LR
    P1[一期 已结项<br/>Web 卡通<br/>无登录<br/>人设+记忆<br/>提示词+词库]
    P2[二期近程<br/>语音 STT+TTS<br/>记忆+心情<br/>故事库<br/>可选审核]
    P3[另阶段/三期<br/>登录家长<br/>小程序/App<br/>玩法扩展]
    P1 --> P2 --> P3
```

---

## 2. 产品思维导图

### 2.1 总览

```mermaid
mindmap
  root((玖伴))
    用户
      小学生与初中生
      家长另阶段
    价值
      陪伴优先
      零门槛
      安全底线
      记得你
      温暖不越界
    场景
      闲聊解闷
      听故事
      好奇问答
      轻度说说心事
      角色陪伴
    一期已结
      Web卡通UI
      流式对话
      统一未成年人
      官方人设
      轻量记忆
      话题卡片
      提示词加词库安全
      无登录本地档案
    明确不做近期
      登录账号
      恋爱角色
      家长同意
      成人皮肤
      多模型UI
      RAG工作台
    二期近程
      语音说话与朗读
      记忆与心情
      故事话题包
      可选审核API
```

### 2.2 功能模块脑图（研发拆分视角）

```mermaid
mindmap
  root((模块拆分))
    前端 Web
      聊天页
      角色选择
      模式开关
      话题卡片
      卡通皮肤
      本地存储
    陪伴 BFF
      会话 API
      流式代理
      人设注入
      记忆读写
      安全管道
    人设系统
      小暖
      跳跳
      阿茶
      System Prompt
    安全系统
      分龄提示词
      规则词库
      输入过滤
      输出过滤
    存储
      会话消息
      匿名档案
      记忆摘要
      词库配置
    模型层
      OpenAI 兼容
      密钥仅服务端
```

---

## 3. 项目架构图

### 3.1 系统逻辑架构（MVP）

```mermaid
flowchart TB
    subgraph Client["客户端 · Web H5（卡通皮肤）"]
        UI[聊天 UI]
        LS[本地档案<br/>昵称/模式/会话缓存]
        UI --- LS
    end

    subgraph BFF["陪伴 BFF（后端）"]
        API[HTTP API]
        COMP[人设与模式服务]
        MEM[记忆服务]
        SAFE[安全管道<br/>提示词 + 词库]
        CHAT[Chat 流式服务]
        API --> COMP
        API --> MEM
        API --> SAFE
        API --> CHAT
        SAFE --> CHAT
        COMP --> CHAT
        MEM --> CHAT
    end

    subgraph Data["数据层"]
        DB[(SQLite / 文件存储<br/>Session · Message · Memory · Lexicon)]
    end

    subgraph Ext["外部"]
        LLM[LLM Provider<br/>OpenAI 兼容]
    end

    UI -->|REST / SSE| API
    CHAT --> LLM
    COMP --> DB
    MEM --> DB
    SAFE --> DB
    CHAT --> DB
```

### 3.2 单次请求时序

```mermaid
sequenceDiagram
    actor U as 用户
    participant FE as Web 前端
    participant API as 陪伴 BFF
    participant S as 安全管道
    participant M as 记忆/人设
    participant LLM as LLM Provider

    U->>FE: 输入并发送
    FE->>FE: 渲染用户消息
    FE->>API: POST /api/chat (SSE)
    API->>M: 取人设 + 模式 + 记忆
    API->>S: 输入词库检测
    alt 命中拦截
        S-->>FE: 安全话术（流式或一次性）
        FE-->>U: 温和转话题
    else 放行
        API->>LLM: chat.completions (stream)
        loop token
            LLM-->>API: delta
            API->>S: 输出侧抽检/缓冲策略
            API-->>FE: SSE chunk
            FE-->>U: 逐字展示
        end
        API->>M: 异步更新记忆摘要
    end
```

### 3.3 推荐仓库目录结构（落地参考）

> **完整文件级约定（含 PRD 对照、放置规则）**：见 [`docs/directory-structure.md`](./directory-structure.md)。  
> 正式目录名为 **`frontend/`**、**`backend/`**（不再使用计划旧称 `web/`、`server/`）。

```mermaid
flowchart TB
    ROOT[chatbot/]
    ROOT --> DOCS[docs/<br/>PRD · 目录约定 · 本图]
    ROOT --> DEMO[demo/<br/>HTML 产品壳对照]
    ROOT --> FE[frontend/<br/>正式 Web UI]
    ROOT --> BE[backend/<br/>陪伴 BFF]

    DEMO --> D1[pages · store.js · cartoon.css]
    DEMO --> D2[assets/brand 玖伴图标]

    FE --> F1[views · composables · themes/cartoon]
    FE --> F2[api 唯一 HTTP · stores]

    BE --> S1[api/chat · sessions · companions · profile]
    BE --> S2[services/chat 编排]
    BE --> S3[capabilities/persona · memory · safety · llm]
    BE --> S4[prompts · data/lexicon · storage · config]
```

**文字版目录（摘要；细目见 directory-structure.md）：**

```text
chatbot/
├── README.md
├── docs/
│   ├── PRD.md
│   ├── diagrams.md              ← 本文件
│   └── directory-structure.md   ← frontend/backend 文件级约定
├── demo/                        ← HTML 产品壳对照（不接真模型）
├── frontend/                    ← 正式前端（接 BFF；views + api 垂直对齐）
│   └── src/{views,api,composables,components,stores,themes…}
├── backend/                     ← 陪伴 BFF（api → services/chat → capabilities）
│   └── src/{api,services,capabilities,prompts,storage,config…}
├── vendor/                      ← 参考源码，非运行时
└── docker-compose.yml           ← 可选本地起 backend（用户无感）
```

### 3.4 数据关系（概念）

```mermaid
erDiagram
    PROFILE ||--o{ SESSION : owns
    PROFILE ||--o{ MEMORY : has
    COMPANION ||--o{ SESSION : used_by
    SESSION ||--|{ MESSAGE : contains
    MESSAGE }o--o| SAFETY_HIT : may_have

    PROFILE {
        string anonymous_id
        string nickname
        string mode
    }
    COMPANION {
        string id
        string name
        string system_prompt
    }
    MEMORY {
        string key
        string value
    }
    SESSION {
        string id
        string companion_id
        string title
    }
    MESSAGE {
        string id
        string role
        string content
        string safety_action
    }
```

---

## 4. 页面信息架构（简图）

```mermaid
flowchart TB
    W[欢迎 / 首次引导] --> M[选模式]
    M --> N[设昵称可选]
    N --> R[选角色]
    R --> C[聊天主界面]
    C --> T[话题卡片]
    C --> H[历史会话列表]
    C --> S[本地设置<br/>模式切换 / 清记忆]
    H --> C
    S --> C
```

一期**没有**：登录页、家长同意页、模型配置页、恋爱角色页。

---

## 5. 图例说明

| 图 | 用途 |
|----|------|
| §1 流程图 | 产品/研发对齐「用户怎么走、消息怎么过安全」 |
| §2 思维导图 | 范围边界、模块拆分、防范围膨胀 |
| §3 架构图 | 前后端边界、目录落地、数据关系（文件级约定见 `directory-structure.md`） |
| §4 信息架构 | 页面有哪些、没有哪些 |

如需导出 PNG/SVG，可用 Mermaid CLI 或 IDE 插件对上述代码块导出。
