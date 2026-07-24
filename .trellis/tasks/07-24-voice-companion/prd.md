# 语音陪伴：按住说话与朗读

## Goal

在聊天页提供 **按住说话（STT）** 与 **朗读回复（TTS）**，中文优先、无登录，转写文本与打字输入走同一安全管线。

## Background

承接 `07-24-phase2-planning`：二期 P0 首切片。一期已结项（内部测）。目录约定：`frontend` voice 组件；`backend` `capabilities/speech`（若走云端）。

## Parent / 交接

规格承接已归档规划任务 `07-24-phase2-planning`（一期结项 + 二期 backlog）。本任务独立实现语音切片。


## Requirements

- **R1 STT**：聊天页按住说话 → 得到中文文本 → 可填入输入框或直接发送；权限拒绝 / 识别失败用人话提示。
- **R2 TTS**：助手回复可朗读（按钮；是否自动播另定）；流式过程中的朗读策略在 design 中定。
- **R3 安全**：STT 文本必须经现有词库/提示词路径，禁止语音旁路。
- **R4 密钥**：若用云 STT/TTS，密钥仅 `backend/.env`。
- **R5 范围**：仅聊天页、中文优先；不依赖登录/家长。

## Acceptance Criteria

- [ ] AC1：按住说话可将识别文本进入发送流程并收到流式回复。
- [ ] AC2：可朗读最近一条（或当前）助手回复。
- [ ] AC3：麦克风拒绝 / 识别失败有人话提示，不静默失败。
- [ ] AC4：命中安全词库的语音转写与打字同等拦截。
- [ ] AC5：无登录、无成人模式相关改动。

## Out of scope

- 多语言、声纹、实时打断对谈、离线包、家长管控挂钩
- 登录 / 记忆增强 / 故事库（后续任务）

## Notes

- 浏览器 Web Speech vs 后端云方案在本任务 `design.md` 锁定后再 `task.py start`。
- 规划交接规格见 `.trellis/tasks/07-24-phase2-planning/design.md`。
