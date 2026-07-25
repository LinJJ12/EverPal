# Design: 混合云端 TTS + ASR

## Architecture

```
Frontend                          Backend                         百炼
────────                          ───────                         ────
speak(text, companionId)
  → POST /v1/speech/tts  ──►  capabilities/speech/tts.py  ──►  qwen-audio-3.0-tts-flash
  ← audio/mpeg|wav bytes  ◄──  proxy bytes                 ◄──
  on fail → speechSynthesis (browser)

VoiceTalkButton stop
  → record Blob
  → POST /v1/speech/asr  ──►  capabilities/speech/asr.py  ──►  qwen3-asr-flash
  ← { text }              ◄──
  on fail → useSpeechRecognition (browser)
  → sanitize → composer → existing send
```

## Backend

### Settings (`.env`)

| 变量 | 默认 | 说明 |
|------|------|------|
| `DASHSCOPE_API_KEY` | 空 | 百炼 Key；空则云端语音不可用 |
| `DASHSCOPE_BASE_URL` | `https://dashscope.aliyuncs.com/api/v1` | 可改成业务空间 MaaS 域名 |
| `DASHSCOPE_COMPAT_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | ASR OpenAI 兼容 |
| `TTS_MODEL` | `qwen-audio-3.0-tts-flash` | |
| `ASR_MODEL` | `qwen3-asr-flash` | |
| `TTS_VOICE_NUAN` | `longanhuan_v3.6` | |
| `TTS_VOICE_TIAO` | `longjielidou_v3.6` | |
| `TTS_VOICE_CHA` | `longanhuan_v3.6` | 暂与小暖同；可后改 |
| `SPEECH_TIMEOUT_SECONDS` | `60` | |

可选：若希望复用现有 Key，实现时可允许 `DASHSCOPE_API_KEY` 缺省时不回退到 `LLM_API_KEY`（避免误用）；**推荐单独配置** `DASHSCOPE_API_KEY`，与 LLM Key 解耦（用户 MaaS 与百炼 Key 可能不同）。

### Routes

- `POST /v1/speech/tts`  
  Body: `{ "text": string, "companion_id": "nuan"|"tiao"|"cha" }`  
  Success: `200` + raw audio (`Content-Type` 按上游，优先 mp3/wav)  
  Errors: `503 speech_unavailable`（无 Key / 鉴权失败）、`502 speech_upstream`、`400` 校验（含空白文本「请先说点什么再朗读」）；`message` 人话中文，不透出 Pydantic 英文。

- `POST /v1/speech/asr`  
  `multipart/form-data`：`file`（webm/wav/mp3…）  
  Success: `{ "text": string }`  
  同样错误码策略。

### Capability layer

- `backend/src/capabilities/speech/`：`client.py`、`tts.py`、`asr.py`  
- 使用 `httpx` 调 DashScope HTTP（优先非流式；TTS 若返回 URL 则后端再下载再转发，前端永不持外链；URL 仅允许 `*.aliyuncs.com`）。  
- 依赖：纯 HTTP（httpx），减少 SDK 与事件循环耦合。  
- 单测：mock httpx，覆盖无 Key / 上游失败 / 成功路径 / SSRF 拒绝。

## Frontend

- `useSpeechSynthesis`：先 `fetch` TTS → `Audio` 播放；失败再走现有 browser speak。  
- `VoiceTalkButton` / recognition 路径：优先 `MediaRecorder` 录一段 → ASR API；失败或无麦克风上传能力时再浏览器 STT。  
  - 若浏览器 STT 与 MediaRecorder 都可用：云端优先（录完上传）。  
  - 云端失败提示人话后自动/可点回退浏览器。  
- 新增 `api/speech.ts` 客户端封装；Key 永不进前端。

## Compatibility

- 无 `DASHSCOPE_API_KEY`：行为与今日一致（纯浏览器），接口返回 503，前端静默回退。  
- 不改 chat/session/memory 契约。

## Rollback

- 去掉 speech 路由与前端云端分支即可回退；或清空 Key。
