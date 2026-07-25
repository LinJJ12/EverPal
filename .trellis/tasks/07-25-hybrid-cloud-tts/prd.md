# 混合云端语音：TTS + ASR，浏览器回退

## Goal

聊天「朗读」与「点我说话」优先走阿里云百炼云端（神经网络 TTS / ASR），听感更自然、识别更稳；无 Key 或调用失败时回退现有浏览器 Web Speech，不阻断打字聊天。

## Background

- 浏览器语音切片已交付；本机中文 TTS 音色少，三伙伴常像同一机器声。
- Key 只放 `backend/.env`；云端能力落在 `backend/src/capabilities/speech`。
- 方案 C：云端优先 + 浏览器回退；TTS 与 ASR 同一切片。

## Confirmed decisions

| 项 | 选择 |
|----|------|
| TTS 模型 | `qwen-audio-3.0-tts-flash`（可经 `.env` 覆盖） |
| ASR 模型 | `qwen3-asr-flash`（可经 `.env` 覆盖） |
| 音色 | 全 flash：小暖/阿茶 `longanhuan_v3.6`，跳跳 `longjielidou_v3.6`（可经 `.env` 覆盖） |
| API | 后端完整代理；不做 TTS 缓存 |
| 听写形态 | 说完再传（非实时流式 ASR） |
| 配置 | 模型名、音色、Key、超时等写入 `.env` / `.env.example` |
| 结构 | `capabilities/speech/{client,tts,asr}`；前端 `utils/voice/`；DTO `schemas/speech.py` |
| 不做 | plus、fun-music、livetranslate、声音复刻、家长管控 |

## Requirements

- **R1 TTS**：`POST /v1/speech/tts`；按 `companion_id` 选 voice；返回音频字节；失败 → 浏览器 `speechSynthesis`。
- **R2 ASR**：点我说话录制结束 → `POST /v1/speech/asr` → 文本写入 composer → 现有发送/安全管线；失败 → 浏览器 STT。
- **R3 配置**：`DASHSCOPE_*` / `TTS_*` / `ASR_*` 均来自 settings / `.env`；无 Key → `speech_unavailable`，前端回退。
- **R4 安全**：前端无语音 Key；ASR 文本与打字同一路径；TTS 音频 URL 仅允许阿里云域名。
- **R5 UX**：人话错误提示；不因语音失败卡死聊天。
- **R6 截断**：对齐 `SPEECH_SPEAK_MAX_CHARS` / `SPEECH_TRANSCRIPT_MAX_CHARS` 量级。

## Acceptance Criteria

- [x] AC1：配置 Key 后，云端朗读可用；小暖 vs 跳跳音色可区分（实网冒烟通过）。
- [x] AC2：点我说话优先云端 ASR；失败/无 Key 回退浏览器 STT。
- [x] AC3：TTS 失败/无 Key 时浏览器朗读可用。
- [x] AC4：前端无百炼 Key；模型/音色可从 `.env` 调整。
- [x] AC5：`pytest` 39 通过 + `frontend` build 通过。

## Out of scope

- `qwen-audio-3.0-tts-plus`、Sambert、fun-music、livetranslate
- 实时流式 ASR / TTS 打断对谈
- TTS 结果缓存、声音复刻
- 登录 / 家长面板
