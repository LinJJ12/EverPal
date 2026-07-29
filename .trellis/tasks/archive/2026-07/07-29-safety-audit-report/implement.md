# Implement — 安全抽检报告与词库打磨

## Checklist

1. [x] 盘点现有 lexicon terms 与硬编码单测，列出基线矩阵缺口
2. [x] 编写/扩写 `safety_cases.json` 至基线档（含 miss）
3. [x] 跑 `pytest tests/unit/test_safety_lexicon.py`；对失败补 lexicon（必要时极小代码修）
4. [x] 抽查出站闸门 / 记忆门闸是否需加 1～2 条回归测例（既有覆盖足够，未新增）
5. [x] 撰写 `docs/safety-audit-report.md`（含复跑命令、LLM 清单、已知问题）
6. [x] 全量相关 pytest 再跑一遍；更新 README「当前阶段」若需要一句指向报告

## Validation

```powershell
conda activate chatbot
cd backend
pytest tests/unit/test_safety_lexicon.py tests/unit/test_safe_stream.py tests/unit/test_memory_and_output_gate.py -q
```

## Risky files

- `backend/src/data/lexicon/*.json` — 过宽 term 会误杀心事倾诉
- `safety.py` — 默认勿改匹配语义

## Done when

- PRD acceptance 全部可勾选
- 报告已进 `docs/`
