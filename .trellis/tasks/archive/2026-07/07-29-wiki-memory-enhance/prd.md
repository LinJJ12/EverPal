# PRD — 百科相关性与记忆增强

## Goal

提升「百科」短问/口语命中率；用规则增强让跨会话记忆更稳、更少重复（本轮不做向量检索）。

## Decisions

| 决策 | 选择 |
|------|------|
| 记忆深度 | **规则增强（推荐集 B）**；向量另开任务 |
| 百科 | **lemma JSON 表 + 口语 regex**；保留 `title_covers_topic`；不做 LLM 改写 |
| MCP | 开发辅助可参考 Wikipedia MCP；**不接入**孩子聊天管线（见 `research/mcp-skills.md`） |

## Background

- 百科：除「天/蓝→天空」外几乎无口语 mapping；「讲讲X / 咋来的」等易 miss。
- 记忆：规则窄、无去重、like 与 `profile.likes` 双轨；FIFO 8 条。

## Requirements

| ID | 需求 |
|----|------|
| W1 | 可维护 lemma 表（口语/短问 → 1..N 搜索词），在 `search_queries_from_message` 前合并。 |
| W2 | 扩展 topic/regex：`讲讲X`、`X咋来的`、`为啥` 变体等；保留硬门控与 fail 无来源。 |
| W3 | 单测：至少覆盖「天为啥蓝」「讲讲恐龙」「X咋来的」及既有 性≠数学 回归。 |
| M1 | 归一化去重：同 client 近重复记忆不重复插入。 |
| M2 | 「帮我记住 / 记一下 / 别忘了」→ `preference`（过词库后）。 |
| M3 | 「我喜欢X」类命中 → 写入 like 记忆，并合并 X 到 `profile.likes`（去重、上限）。 |
| M4 | 单测覆盖去重、「记住」、likes 同步；不影响 safety 拦截路径。 |

## Acceptance Criteria

1. 点「百科」问「天为啥蓝的」→ 优先命中「天空」类词条（或明确 miss 不挂错条）。
2. 「讲讲恐龙」能检索到恐龙相关标题。
3. 连续两次「我喜欢画画」只保留一条记忆（或第二条被跳过）。
4. 「帮我记住明天要带水彩笔」→ 出现在记忆列表 / snippet。
5. 「我喜欢恐龙」后 profile.likes 含「恐龙」（在 persist + client_id 路径下）。
6. `pytest` 相关用例通过；向量 / MCP 运行时接入不在本轮。

## Out of scope

- 向量记忆、助手侧抽取、开放网页、LLM wiki rewrite、家长面板

## Technical Notes

- Wiki lemma：`backend/src/data/wiki/lemma_map.json`（或 `capabilities/wiki/lemma_map.json`）
- Memory：`memory.py` + `memory_repo.add_memory` 去重；likes 经 `profile_repo`
- 调研：`research/mcp-skills.md`
