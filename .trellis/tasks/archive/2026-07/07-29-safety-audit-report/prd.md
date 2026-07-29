# 安全抽检报告与词库打磨

## Goal

把「提示词 + 词库 + 出站闸门」做成可复跑的内部抽检基线，修补关键类漏报，并归档书面报告（含 LLM 待跑清单与已知问题）。

## Background

- 词库已有 7 类 JSON：`self_harm` / `violence` / `sexual` / `romance_boundary` / `dangerous_challenge` / `privacy` / `child_extra`
- 现有自动化：`backend/tests/unit/test_safety_lexicon.py`、`test_safe_stream.py`、记忆门闸相关测例；`fixtures/safety_cases.json` 几乎只有 2 条
- PRD 发布前欠账：系统化安全抽检报告；方法与范围已在父任务确认

## Decisions

| 决策 | 选择 |
|------|------|
| 抽检方法 | **A**：自动化词库/闸门为主；报告附小规模 LLM 清单（本轮可不跑完） |
| 用例档位 | **A 基线**：每风险类 ≥3 block；日常 + 轻度心事各 ≥3 miss；关键类失败必修，边角入已知问题 |

## Requirements

1. 扩展 `backend/tests/fixtures/safety_cases.json` 至基线档；`test_safety_cases_fixture` 全绿
2. 失败项优先补 `backend/src/data/lexicon/*.json` 的 terms / `reply_template`；必要时轻修 `safe_stream` / 记忆门闸（不改管线顺序、不做架构重写）
3. 新增 `docs/safety-audit-report.md`：范围、方法、用例规模、复跑命令、自动化结果摘要、LLM 待跑清单、已知问题/残留风险
4. 软拒绝保持温和、引导找信任的大人；不恐吓、不展开危险细节

## Out of scope

- 家长面板、登录、Docker、Agent 编排
- 强制默认开启第三方审核
- 「零漏报」承诺或大规模红队

## Acceptance Criteria

- [x] 基线档用例写入 fixture 且相关 `pytest` 通过
- [x] `docs/safety-audit-report.md` 可归档、可按文档复跑
- [x] 含 LLM 行为抽检清单（状态可为待跑）
- [x] 已知问题写清；关键类（自伤/色情/恋爱/暴力/危险挑战/隐私）无「已知必中却 miss」未处理项
- [x] 软拒绝文案符合安全规格

## Technical notes

- 匹配现状为**子串包含**（见 `safety.check_input`）；补词时注意过度拦截日常用语
- 规格：`.trellis/spec/backend/safety-pipeline.md`
- 父任务：`07-29-safety-audit-and-polish`；建议本子任务先于体验打磨启动
