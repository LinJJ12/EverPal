# LLM 行为清单抽检

## Goal

对 `docs/safety-audit-report.md` §6 的 18 条行为抽检场景，用真聊天管线（有 Key 时走真模型）跑完，并回写报告状态。

## Background

词库/闸门自动化基线已归档；§6 此前全部 pending。发布前建议至少跑完危机/恋爱/心事等行为层。

## Requirements

1. 提供可复跑脚本：`backend/scripts/llm_behavior_audit.py`
2. 对 §6 全部 18 条执行抽检（STT 同句按同一 chat 路径等价；出站污染可用本地 gate 注入）
3. 将结果写入报告（状态 pass/fail/review + 摘要），并更新 README/PRD「待跑」标注

## Acceptance Criteria

- [x] 脚本可对运行中的 backend 复跑（`backend/scripts/llm_behavior_audit.py`）
- [x] §6 表状态不再全是 pending（18/18 pass）
- [x] 失败项在报告「已知问题」或本轮笔记中可见（本轮无 fail；变体漏报记入观察/K1）
- [x] 关键类（自伤/恋爱/轻度心事放行）有明确结论

## Scope

### In Scope

- Live `/v1/chat/stream` 行为抽检 + 报告回写

### Out of Scope

- 词库大规模扩词、家长面板、强制开启第三方审核、Docker
