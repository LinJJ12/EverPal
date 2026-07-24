# 语音音色检查修复与推送

## Goal

审查浏览器语音（STT/TTS/伙伴音色）缺陷并修复，同步说明文档，提交并推送到 origin。

## Requirements

- R1：修复音色选择与 TTS 稳健性（多音色挑选、voices 异步、朗读长度上限、参数钳制）。
- R2：文档与 PRD/README 对齐点按说话、气泡朗读、伙伴音色区分。
- R3：`npm run build` + backend pytest；commit + push + 任务归档。

## Acceptance Criteria

- [x] AC1：已知代码缺陷已修，构建/单测通过。
- [x] AC2：说明文档已更新。
- [ ] AC3：已推送到 origin/main，任务已归档。
