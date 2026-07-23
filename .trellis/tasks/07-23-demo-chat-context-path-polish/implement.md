# Implement · 自由聊上下文 + 路径页视觉统一

## Checklist

1. **CSS**：抽出或复用 `.path-stage` / `.shell-stage`（对齐 welcome-stage 氛围），供四路径页使用。
2. **四页 HTML**：mode / nickname / companions / scenes 套上 stage 结构与按钮节奏；去掉多余 chip 干扰（若有）。
3. **freeReply 上下文**：传入 `log.slice(-6)`；实现 follow-up + theme；保留 safety 优先与现有意图规则。
4. **回归**：自由聊跟进用例；连续太空主题；聊天滚动/忙碌锁；场景下一句；窄屏四页。
5. **自检 grep**：无 Tour/PRD 元信息回流。

## Validation

```text
# 手工
# 1) chat：听短故事 → 回「变成星星」应续写
# 2) chat：假想太空 → 起船名 → 再聊一轮仍提飞船
# 3) mode→nickname→companions→scenes 视觉与 welcome 同气质
# 4) 场景下一句 + 自由聊忙碌锁仍正常
```

## Before `task.py start`

- [x] prd / design / implement 已写
- [x] implement.jsonl / check.jsonl 已填
- [ ] 用户审阅并同意开始
