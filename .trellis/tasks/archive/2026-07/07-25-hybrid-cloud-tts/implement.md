# Implement: 混合云端 TTS + ASR

## Checklist

1. [x] Settings + `.env.example`：`DASHSCOPE_*`、`TTS_*`、`ASR_*`、`SPEECH_TIMEOUT_SECONDS`
2. [x] `capabilities/speech`：TTS / ASR 客户端（httpx），companion → voice 映射
3. [x] `api/speech.py`：挂载 `/v1/speech/tts`、`/v1/speech/asr`；人话错误
4. [x] 单测：无 Key / mock 成功 / 上游失败
5. [x] 前端 `api/speech.ts` + `useSpeechSynthesis` 云端优先 + Audio 播放 + 浏览器回退
6. [x] 前端点我说话：MediaRecorder → ASR → composer；失败 → 现有 recognition
7. [x] 文档：`README` / `directory-structure` / product-constraints 同步
8. [x] `pytest` + `npm run build`

## Validation

```bash
cd backend && pytest -q   # 39 passed
cd frontend && npm run build
```

手动（`DASHSCOPE_API_KEY` 已配置）：切换小暖/跳跳朗读对比；点我说话后看转写进输入框。

## Structure note (post-implement)

- Backend package: `capabilities/speech/{client,tts,asr}.py` + `schemas/speech.py`
- Frontend: `api/speech.ts` · `utils/voice/*` · `components/voice/VoiceTalkButton.vue`
