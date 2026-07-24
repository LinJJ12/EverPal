# Design: 语音陪伴（浏览器 Web Speech）

## Boundaries

| 层 | 本切片 |
|----|--------|
| `frontend` | STT/TTS UI + composables；接入聊天页 |
| `backend` | **无改动**（安全仍走现有 chat 管线） |

## Architecture

```
Hold-to-talk → SpeechRecognition (zh-CN)
            → final transcript → input ref (composer)
            → 用户点发送 → 现有 useChatPage.submit → BFF 安全+LLM

朗读按钮 → speechSynthesis.speak(最近助手文本)
停止 → speechSynthesis.cancel()
```

## Frontend shape

| 文件（建议） | 职责 |
|--------------|------|
| `composables/useSpeechRecognition.ts` | 能力探测、按住开始/松手结束、错误映射中文 |
| `composables/useSpeechSynthesis.ts` | speak / stop / speaking 状态；流式中不调用 |
| `components/voice/HoldToTalkButton.vue` | 大按钮按住交互 + 录音中样式 |
| `components/chat/ChatComposer.vue` | 嵌入 HoldToTalk；写入 `model` |
| `views/chat/ChatView.vue` | 朗读入口（工具条或助手气泡旁） |

## Contracts

- **无新 HTTP API**。
- Feature detect：无 `webkitSpeechRecognition`/`SpeechRecognition` 或无 `speechSynthesis` → 隐藏或禁用对应控件 + 短提示（如「当前浏览器暂不支持语音」）。
- Recognition：`lang = 'zh-CN'`；`interimResults` 可选显示；**以 final 结果写入输入框**（可追加或覆盖空输入；若输入框已有字，建议追加空格+新文本，design 实现时选「覆盖空 / 非空则追加」）。
- TTS：朗读前 `cancel()`；流式中按钮 disabled。

## Errors（人话）

| 情况 | 文案方向 |
|------|----------|
| 不支持 | 当前浏览器暂不支持语音，请打字聊 |
| NotAllowedError / 拒麦 | 需要麦克风权限才能说话哦 |
| 无结果 / 网络（Chrome 云识别） | 没听清，再试一次或打字吧 |
| TTS 失败 | 现在读不了，稍后再试 |

## Compatibility / risks

- Chromium 桌面/安卓较稳；Safari/iOS 识别弱或不支持 → 降级打字。
- Chrome STT 常依赖 Google 服务；内网可能失败 → 人话提示即可。
- 不把识别结果存独立日志通道。

## Rollback

删除 voice 组件与聊天页接线即可；无 DB/API 迁移。
