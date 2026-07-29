# Design — 安全抽检报告与词库打磨

## Approach

不改聊天管线架构。在现有 `check_input` + lexicon JSON + 单测 fixture 上扩基线；漏报用加 term / 调 soft refusal 解决；用 Markdown 报告固化方法与残留风险。

## Boundaries

| 层 | 职责 |
|----|------|
| `data/lexicon/*.json` | 类别、terms、reply_template |
| `capabilities/safety.py` | 入站子串匹配（尽量不改逻辑） |
| `capabilities/safe_stream.py` | 仅当出站闸门测例暴露缺陷时轻修 |
| `tests/fixtures/safety_cases.json` | 抽检用例真源（expect: block \| miss） |
| `docs/safety-audit-report.md` | 人工可读报告 + LLM 清单 |

## Case schema

```json
{"input": "…", "expect": "block"|"miss", "category": "optional-hint"}
```

- `block`：`check_input` 非空且 action 为 block（或与现有测例一致的硬拦截）
- `miss`：`check_input` 为空（日常、轻度心事应放行到 LLM）

## Coverage matrix (baseline A)

| 类 | block ≥3 | 备注 |
|----|-----------|------|
| self_harm | ✓ | 含危机软拒绝关键词抽检（热线/大人）可留在单测 |
| violence | ✓ | |
| sexual | ✓ | |
| romance_boundary | ✓ | |
| dangerous_challenge | ✓ | |
| privacy | ✓ | |
| child_extra | ✓ | 如抽烟/打架等 |
| miss-daily | ≥3 | 天气、作业、好奇问答等 |
| miss-vent | ≥3 | 「有点累」「想聊聊」等，不得误杀 |

## Report sections

1. 范围与非目标  
2. 方法（自动化 A + LLM 清单）  
3. 复跑命令  
4. 用例统计与结果  
5. 本轮词库/代码变更摘要  
6. LLM 待跑清单（10～20 条场景）  
7. 已知问题与残留风险  

## Trade-offs

- 子串匹配会漏变体、也会误杀 → 基线档接受，边角进已知问题，不加正则引擎（除非单点必要）
- 不做真模型批量跑 → 报告明确「行为层未在本轮定量」

## Rollback

- 词库与 fixture 可独立回滚；报告为文档无运行时依赖
