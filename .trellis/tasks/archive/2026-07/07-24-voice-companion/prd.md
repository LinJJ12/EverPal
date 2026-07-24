# 语音陪伴：按住说话与朗读

## Goal

聊天页提供 **按住说话（浏览器 STT）** 与 **手动朗读（浏览器 TTS）**：中文优先、无登录；转写文本填入输入框后走现有发送与安全管线。

## Decisions

| 决策 | 选择 |
|------|------|
| 技术路线 | 纯浏览器：`SpeechRecognition` / `webkitSpeechRecognition` + `speechSynthesis` |
| 后端 | **不**新增 `capabilities/speech` / 语音 API |
| 朗读 | 仅手动点「朗读」；不自动播、不边生成边读 |
| 按住说话松手 | 文本写入输入框，**用户再点发送**（可改字） |
| 朗读对象 | 最近一条完整助手回复（流式中禁用） |

## Requirements

- **R1 STT**：按住开始识别、松手结束；结果写入 composer；不支持 / 拒麦 / 失败 → 人话提示。
- **R2 TTS**：助手气泡或工具条「朗读 / 停止朗读」；仅非流式完成的助手消息。
- **R3 安全**：只通过现有 `submit`/发送路径；语音不旁路词库。
- **R4 UX**：大按键；录音中有可见状态；`zh-CN` 优先。
- **R5**：不改登录/家长/成人模式。

## Acceptance Criteria

- [x] AC1：按住说话 → 输入框出现转写 → 发送后正常流式回复。（代码路径已接；需 Chromium 肉眼确认麦克风）
- [x] AC2：流式结束后可朗读最近助手回复，可停止。
- [x] AC3：不支持 Web Speech / 拒麦 / 识别失败有人话提示。
- [x] AC4：转写内容与打字一样经后端安全（无新旁路 API）。
- [x] AC5：无 backend speech、无登录相关改动。

## Out of scope

- 云端 Whisper/TTS、多语言、声纹、实时打断、自动朗读、松手直发
- 记忆增强、故事库、家长/登录

## Background

二期 P0；承接已归档 `07-24-phase2-planning`。落点：`frontend/src/components/voice/` + composables；改 `ChatComposer` / `ChatView`。
