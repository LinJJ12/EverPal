# `frontend/src`

```text
views → composables → api → backend
         ↘ stores
```

- `api/`：唯一 HTTP / SSE（`mood.ts` 今日心情；`history.ts` 月历）
- `content/packs.ts`：官方话题 / 场景 / 短故事唯一静态内容源（非 HTTP）
- `content/openers.ts`：伙伴空态开场白
- `utils/activeSession.ts`：active session + 按伙伴映射
- `utils/chatSidebar.ts`：聊天侧栏展开偏好（本机）
- `components/mood/moodOptions.ts`：心情 UI 常量、短句、表情风格本机偏好（`cnTodayKey` 转自 `utils/timeCn`）
- `utils/timeCn.ts`：东八区日历日（mood / history 共用）
- `composables/useChatSession.ts`：会话加载 / 伙伴切换 / bootstrap
- `composables/useChatSpeak.ts`：气泡朗读控制
- `composables/useMoodGate.ts`：进聊天门闸；门闸通过后才 bootstrap
- `composables/useTopicCards.ts`：空态话题卡（读 packs）
- `composables/useHistoryCalendar.ts`：历史页月历翻月与当日会话
- `views/`：一页一目录（含 games / safety；无成人 mode 页）；`scenes/` 含情境 + 短故事
- `composables/useSpeech*`：混合语音（云端优先）；朗读进度用 `progressRatio` 驱动气泡变色
- `api/speech.ts`：TTS / ASR HTTP（无 Key）
- `components/voice/`：`VoiceTalkButton`（点我说话 / 说完了）
- `components/mood/`：`MoodGate` / `MoodSticker`
- `utils/voice/`：浏览器 STT/TTS、MediaRecorder、朗读进度估算
- `stores/`：跨页档案状态
- `themes/cartoon/`：`cartoon.css` + `mood.css` + `chat.css` + `history.css` + `games.css`
- `utils/gamesMeta.ts`：Vue 游戏大厅列表（与 `public/games/games-common.js` META 对齐）
- `public/games/`：本地小游戏静态页（新增流程见该目录 README）
- `scripts/games/`：游戏 smoke / playtest（勿放进 public）

禁止：页面裸 `fetch`；前端放置 LLM Key / 云端语音 Key；把 UI 常量塞进 `api/`。
