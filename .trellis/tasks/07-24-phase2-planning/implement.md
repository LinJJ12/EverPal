# Implement: 一期结项文档 + 二期 backlog 同步

## Checklist

1. [x] 更新 `docs/PRD.md`
2. [x] 更新 `README.md`「当前阶段」
3. [x] 更新 `.trellis/spec/guides/product-constraints.md`
4. [x] 更新 `docs/diagrams.md`
5. [x] 创建并链接 `07-24-voice-companion`（planning；未 start）
6. [ ] 本任务 check → commit → archive

## Validation

- 人工通读：PRD / README / constraints 无「已上线发布」暗示；无成人模式/成人皮肤入口表述。
- `python ./.trellis/scripts/task.py list`：规划任务完成后可归档；语音任务为下一活跃实现项。

## Gate before start

- [ ] 用户已审阅本 `prd.md` / `design.md` / `implement.md` 并批准 `task.py start`
- [ ] 确认：本任务范围仅文档，不写语音代码

## Rollback

`git revert` 文档提交即可。
