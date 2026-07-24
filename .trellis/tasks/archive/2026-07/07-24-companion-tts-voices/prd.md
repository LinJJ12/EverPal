# 伙伴朗读音色区分

## Goal

浏览器朗读按小暖 / 跳跳 / 阿茶使用不同 pitch、rate，并尽量挑选不同中文系统音色。

## Requirements

- R1：`speak(text, companionId)` 按伙伴应用预设（温柔 / 活泼 / 沉稳）。
- R2：在可用 `speechSynthesis.getVoices()` 的 zh 音色中尽量选不同 voice；仅一个音色时仍靠 pitch/rate 区分。
- R3：聊天「朗读这条」传入当前伙伴 id。

## Acceptance Criteria

- [x] AC1：切换伙伴后朗读听感有可感知差异（语速/音调或音色）。
- [x] AC2：无中文多音色时不报错，仍能朗读。
- [x] AC3：`npm run build` 通过。

## Out of scope

- 云端定制音色、录音克隆
