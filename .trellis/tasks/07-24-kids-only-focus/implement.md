# Implement: 去掉成人模式

## Checklist

1. **Backend**
   - [x] `enums.Mode` 仅 child；schemas/chat、profile、sessions 对齐
   - [x] 删除 `prompts/modes/adult.md`；强化 `child.md` 倾诉边界
   - [x] `persona`：阿茶 blurb；build_system 不读 adult
   - [x] safety 测试去掉 adult 松绑用例；lexicon mode_scope 去 adult
2. **Frontend**
   - [x] `/mode` 重定向；删除 ModeView；导航/欢迎/设置去成人
   - [x] `types.Mode`、store chrome 固定 child；场景/记忆/历史文案
   - [x] companions / scenes「心事」适龄；`store.js` 同步
3. **Demo**
   - [x] `mode.html` 跳转档案；welcome/index/settings/safety 等清理
4. **Docs / spec**
   - [x] PRD、README、product-constraints、backend/frontend specs
5. **Tests / hardening**
   - [x] `pytest tests` → 27 passed（含拒绝 adult、Mode.coerce）
   - [x] `vue-tsc` / build 通过
   - [x] demo/frontend store 强制 `mode=child`；会话读出归一
   - [x] 清理成人 CSS；空 `views/mode` 目录删除

## Validation

```powershell
conda activate chatbot
cd backend
pytest tests/unit -q
```

## Gate before start

- [x] 用户已批准 start
- [x] 分支 `feature/kids-only-focus`
