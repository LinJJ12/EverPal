# PRD — 联网百科（未成年人安全门控）

## Goal

孩子在聊天输入栏点 **「百科」** 后再发送时，后端调用中文维基检索工具，把安全摘要注入陪伴回答；实际用到摘要时，气泡下提供**默认折叠、展开后可点**的维基来源。失败则静默降级为普通陪伴回答。普通聊天不检索。

## Background

- 产品：`docs/PRD.md` §4.2 P2；须未成年人门控，禁止「成人开启联网」。
- 编排只在 `services/chat`；能力在 `capabilities/wiki/`；不做 RAG 工作台 / 开放网页搜索。

## Decisions

| 决策 | 选择 |
|------|------|
| 语料 | 中文维基百科 only |
| 增强方式 | 服务端工具 + 检索（非 LLM native function calling） |
| 触发 | **显式「百科」按钮**（`use_wiki`；普通聊天不检索） |
| 来源 UI | 可折叠来源链接；默认收缩，展开后可点 |
| 失败 | 静默降级；无来源区、无技术报错 |
| 按钮体验 | 点亮后发一条即查；**发送时立即熄灭**（一次一问）；切换伙伴/载入会话会重置 |

## Requirements

| ID | 需求 |
|----|------|
| R1 | 仅 `use_wiki=true` 时调用 `wiki`；摘要经词库后再注入 system。 |
| R2 | 查询与摘要均走未成年人安全路径；输入仍先过 `check_input`。 |
| R3 | 未开百科 / 超时 / 无词条 / 摘要被拦 → 纯 LLM；不向孩子暴露错误。 |
| R4 | 实际注入摘要时 SSE `done.sources`；前端折叠可点维基链接。 |
| R5 | 维基公共 API 默认无 Key；`WIKI_*` 仅后端。 |
| R6 | 不做文档上传、向量库、MCP、泛网页、自动意图触发。 |

## Acceptance Criteria

1. 点「百科」后问常识：口语化回答 + 可展开维基来源。
2. 未点「百科」的闲聊/问句：不发起维基请求。
3. 维基失败：仍有陪伴回复；无来源区。
4. 输入 block：与现网一致，不查维基。
5. 重新生成：若原助手气泡有 sources，再次带 `useWiki`。
6. 单测覆盖：`use_wiki` 有/无、白名单、filter、force lookup。

## Out of scope

- 第三方审核 API、登录/家长面板、开放网页、Agent tool_calls、百科模式常亮开关（可后置）。

## Technical Notes

- Capability：`backend/src/capabilities/wiki/`
- 协议：`ChatStreamRequest.use_wiki`；SSE `done.sources`
- 前端：`ChatComposer` 百科按钮 → `useChatPage.wikiMode` → `ChatSources.vue`
