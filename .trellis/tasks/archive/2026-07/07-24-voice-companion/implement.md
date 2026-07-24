# Implement: 语音陪伴（Web Speech）

## Checklist

1. [x] `useSpeechRecognition.ts` + `useSpeechSynthesis.ts`
2. [x] `HoldToTalkButton.vue`；接入 `ChatComposer`
3. [x] `ChatView`：朗读 / 停止朗读
4. [x] 卡通样式（hold-talk listening）
5. [x] `npm run build` 通过
6. [x] hook-guidelines 补充 speech composable 约定

## Validation

```powershell
cd frontend
npm run build
```

手动：Chrome 打开聊天 → 按住说话填入 → 发送 → 点朗读 / 停止；拒麦与不支持时看提示。

## Gate before start

- [ ] 用户已审阅 prd/design/implement 并批准 `task.py start`
- [ ] implement.jsonl / check.jsonl 已填真实 spec 条目

## Rollback

Revert 前端 voice 相关提交。
