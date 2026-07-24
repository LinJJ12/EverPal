# 会话边界行为 bug 收口

## Goal

修掉 5 个会误导走查的会话/写路径行为 bug，使「场景/安全示例 → 聊天 → 历史回看 → 重生成」意图清晰、不假成功。

## Background

正式端主路径可联调。本任务只收审查列出的行为项；R4 仅做走查对齐的最小词库补丁，不做整库加厚或记忆加强。

## Scope

轻量任务（仅本 `prd.md`）。五项：

| ID | 需求 |
|----|------|
| R1 | 重生成：UI 与发给后端的 history 均不出现连续两条相同 user |
| R2 | 历史回看成功后，当前 companion / mode 与该会话一致（含 `data-mode` 壳层）；续聊沿用 |
| R3 | 从场景/安全页带 seed 进入聊天前，清空当前 `sessionId`（新开会话意图） |
| R4 | 安全示例与词库对齐：**词库最小补「伤害自己」「自我伤害」**；保留（或极小调整）安全页危险话题种子，保证必命中 |
| R5 | 场景页写档案失败：人话提示且不跳转；成功才进聊天 |

## Confirmed facts (repo)

- `ChatView.regen` → `submit` → `onUser` 再 push → 重复 user（`frontend/src/views/chat/ChatView.vue`、`useChatPage.ts`）。
- `getSession` 返回 `companion_id` / `mode`；聊天页未应用。
- `ScenesView` / `SafetyView` 仅 `?seed=`，不清 `sessionId`。
- `SafetyView` 种子含「伤害自己」；`self_harm.json` 现为：自杀、自残、割腕、不想活、结束生命。Demo 正则已含「伤害自己|自我伤害」。
- `ScenesView`：`save` 失败仍 navigate。

## Out of scope

- 记忆抽取加强
- 大批量词库与抽检框架
- Docker / demo 全面同步
- 归档其它任务

## Technical Notes

- 触达：`ChatView`、`useChatPage`（或 stream）、`ScenesView`、`SafetyView`、`self_harm.json`；必要时补一条词库单测。
- 不改聊天 HTTP/SSE 合同；历史恢复以本地 store + 请求体字段为准。
- R2：回看成功后写入 store 的 companion/mode 并 `applyModeChrome`；宜同步档案以免壳层与其它页不一致（失败时至少本页续聊正确）。
- **Vendor 参考**：`vendor/kids-ai` 默认不入库（见 `vendor/README.md`）；本机若已 clone，R4 补词前对照 `lib/safety_gate.py` / 其测试用词，**只摘中文可复用的自伤表述**，不整库搬日文、不改管线架构。当前仓库内无 kids-ai 源码时，以 `demo/js/store.js` 自伤正则 + 现有 `self_harm.json` 为对齐源（规划阶段已据此定「伤害自己/自我伤害」）。

## Acceptance Criteria

- **AC1**：聊一轮后点「重新生成」→ 用户气泡仍一条；不向后端叠双 user。
- **AC2**：历史点开含特定 companion/mode 的会话 → 侧栏/模式徽章一致，续聊沿用。
- **AC3**：场景或安全页点示例进聊天 → 不挂旧 `sessionId`；seed 正常发出。
- **AC4**：安全页「危险话题」示例命中词库拦截（温和拒答可预期）；词库含「伤害自己」「自我伤害」。
- **AC5**：后端关闭时点场景进入：人话失败提示且留在场景页。
