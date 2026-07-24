# 语音切片审查修复与文档同步

## Goal

审查并修复 Web Speech 语音切片的缺陷与目录/文档漂移，使实现与 `docs/`、规格一致。

## Requirements

- **R1**：修复识别/朗读竞态与 Chrome TTS 已知坑（cancel 后立即 speak、abort 悬挂 Promise、interrupted 误报）。
- **R2**：转写文本长度与控制字符约束，避免异常长文本灌入输入框。
- **R3**：按住说话在 `disabled` / 失焦捕获丢失时正确中止。
- **R4**：同步 `docs/directory-structure.md`、`README`、前端 README/规格：补 `components/voice` 与 speech composables；去掉过时 `views/mode`；标明浏览器语音已交付、云端 speech 仍为可选后续。

## Acceptance Criteria

- [x] AC1：上述代码缺陷已修，`npm run build` 通过。
- [x] AC2：目录说明与仓库实际结构一致（含 voice，无 mode 页）。
- [x] AC3：README / PRD 阶段描述反映语音首切片已落地（浏览器）。

## Out of scope

- 云端 STT/TTS、记忆增强、新建空 `capabilities/speech`
