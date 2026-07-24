# `frontend/src`

```text
views → composables → api → backend
         ↘ stores
```

- `api/`：唯一 HTTP / SSE
- `views/`：一页一目录（含 games / safety；无成人 mode 页）
- `composables/useXxxPage`：页级逻辑；`useSpeech*` 为浏览器语音
- `components/voice/`：`VoiceTalkButton`（点我说话 / 说完了）
- `stores/`：跨页档案状态
- `themes/cartoon/`：`cartoon.css` + `games.css`（自 demo）
- `public/games/`：七款本地小游戏静态页
- `utils/speech.ts`：Web Speech 能力探测与转写清洗

禁止：页面裸 `fetch`；前端放置 LLM Key / 云端语音 Key。
