# Research — MCP / Skills（百科 & 记忆）

> Task: `07-29-wiki-memory-enhance`  
> 决策：本轮记忆 = 规则增强；向量另开。下文供选型参考。

## 本机已有

| 资源 | 用途 | 对本任务 |
|------|------|----------|
| MCP `user-tavily` | 网页检索 | 规划期查资料 OK；**不进孩子聊天管线**（开放网页非目标） |
| MCP `user-omnistream-knowledge-sqlite` | SQLite 知识 | 可参考表结构；非产品记忆 |
| Skill `trellis-session-insight` / `trellis mem` | 开发会话回忆 | 给 AI 写代码用，不是孩子记忆 |
| Skill `tdd` / `domain-modeling` / `research` | 实现与建模 | **本轮实现可用** |

## 百科相关 MCP（网上）

| 项目 | 说明 | 建议 |
|------|------|------|
| [cyanheads/wikipedia-mcp-server](https://github.com/cyanheads/wikipedia-mcp-server) | search / summary / article；支持语种参数 | 开发期对照 zhwiki 结果；**勿替代**现有 `capabilities/wiki` |
| [romancores/wikipedia-mcp](https://github.com/romancores/wikipedia-mcp) | 摘要、章节、相关主题 | 同上 |
| [ProfessionalWiki/MediaWiki-MCP-Server](https://github.com/ProfessionalWiki/MediaWiki-MCP-Server) | 任意 MediaWiki；偏编辑/运维 | 产品只读场景过重 |
| [olgasafonova/mediawiki-mcp-server](https://github.com/olgasafonova/mediawiki-mcp-server) | 搜索+读写+CLI | 读写权限对未成年人产品不合适 |

**结论（百科）**：产品路径继续自研 MediaWiki client + lemma/regex；MCP 仅作开发辅助验证，不挂进 `services/chat`。

## 记忆相关 MCP（网上）

| 项目 | 说明 | 建议 |
|------|------|------|
| [agent-recall](https://github.com/mnardit/agent-recall/) | SQLite 知识图；Cursor MCP | **编码 Agent** 跨会话；非孩子用户记忆 |
| [agent-memory-mcp](https://github.com/ivan812205/agent-memory-mcp) | 混合检索 + 嵌入 | 适合下一刀「向量记忆」调研，不进本轮 |
| [cursor10x-mcp](https://github.com/aiurda/cursor10x-mcp) | Cursor 多维记忆 | 开发工具，非产品 |
| Memstate / dropdat 等 | 商业/SaaS Agent 记忆 | Key 与未成年人数据合规成本高，本轮不做 |

**结论（记忆）**：本轮在 `capabilities/memory` + `memory_repo` 做规则/去重/「记住」指令；向量 MCP 思路留到另开任务（优先**进程内**嵌入，避免把孩子记忆送到第三方 MCP）。

## Skills 建议本轮使用

1. `trellis-before-dev` → 读 backend safety / directory specs  
2. `tdd` → wiki mapping + memory 去重先写红测  
3. `domain-modeling`（可选）→ 统一 like vs profile.likes 用语  
4. 下一刀向量：再开任务时用 `research` skill 对比 sqlite-vec / chromadb 轻量方案  
