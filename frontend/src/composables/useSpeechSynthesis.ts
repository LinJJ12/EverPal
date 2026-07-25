import { ref } from "vue";
import { synthesizeSpeech } from "@/api/speech";
import { speechSynthesisSupported, SPEECH_SPEAK_MAX_CHARS } from "@/utils/voice/browser";
import {
  clampPitch,
  clampRate,
  pickCompanionVoice,
  voiceProfileFor,
} from "@/utils/voice/companionVoice";
import {
  BROWSER_TTS_CHARS_PER_SEC,
  CLOUD_TTS_CHARS_PER_SEC,
  clampSpeakRatio,
  estimateSpeakDurationMs,
} from "@/utils/voice/speakProgress";

let voicesListenerAttached = false;

type ActiveKind = "cloud" | "browser";

interface ActiveSpeak {
  text: string;
  companionId: string;
  rate: number;
  kind: ActiveKind;
  charsPerSec: number;
}

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported() || typeof Audio !== "undefined";
  const speaking = ref(false);
  /** True when playback is paused mid-utterance (progress highlight kept). */
  const paused = ref(false);
  /**
   * Karaoke progress as 0..1 while speaking/paused; -1 when idle or waiting for audio.
   */
  const progressRatio = ref(-1);
  const error = ref("");
  let speakTimer: number | null = null;
  let progressTimer: number | null = null;
  let speakGen = 0;
  let audioEl: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let active: ActiveSpeak | null = null;

  function clearError() {
    error.value = "";
  }

  function clearSpeakTimer() {
    if (speakTimer !== null) {
      window.clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function clearProgressTimer() {
    if (progressTimer !== null) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function setRatio(gen: number, ratio: number) {
    if (gen !== speakGen) return;
    progressRatio.value = clampSpeakRatio(ratio);
  }

  function resetProgressIdle() {
    clearProgressTimer();
    progressRatio.value = -1;
  }

  function revokeObjectUrl() {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      objectUrl = null;
    }
  }

  function stopCloudAudio(expected?: HTMLAudioElement | null) {
    const el = expected ?? audioEl;
    if (!el) {
      if (!expected) revokeObjectUrl();
      return;
    }
    try {
      el.onended = null;
      el.onerror = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    } catch {
      /* ignore */
    }
    if (audioEl === el) {
      audioEl = null;
      revokeObjectUrl();
    }
  }

  function ensureVoices(): SpeechSynthesisVoice[] {
    if (!speechSynthesisSupported()) return [];
    if (!voicesListenerAttached) {
      voicesListenerAttached = true;
      try {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          /* voices populate asynchronously in Chromium */
        });
      } catch {
        /* older engines */
      }
    }
    return window.speechSynthesis.getVoices();
  }

  function finishIdle(gen: number) {
    if (gen !== speakGen) return;
    clearProgressTimer();
    speaking.value = false;
    paused.value = false;
    progressRatio.value = -1;
    active = null;
  }

  function stop() {
    clearSpeakTimer();
    clearProgressTimer();
    speakGen += 1;
    stopCloudAudio();
    if (speechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        /* ignore */
      }
    }
    speaking.value = false;
    paused.value = false;
    progressRatio.value = -1;
    active = null;
  }

  function startMediaProgress(
    el: HTMLAudioElement,
    text: string,
    gen: number,
    charsPerSec: number,
    rate = 1,
    resumeFromRatio = 0,
  ) {
    clearProgressTimer();
    const initial = clampSpeakRatio(resumeFromRatio);
    setRatio(gen, initial);
    const fallbackMs = estimateSpeakDurationMs(text, rate, charsPerSec);
    const startedAt = performance.now() - initial * fallbackMs;

    progressTimer = window.setInterval(() => {
      if (gen !== speakGen || paused.value) {
        if (gen !== speakGen) clearProgressTimer();
        return;
      }
      const wall = clampSpeakRatio((performance.now() - startedAt) / fallbackMs);
      const d = el.duration;
      const t = el.currentTime;
      if (d && Number.isFinite(d) && d > 0 && Number.isFinite(t) && t > 0.08) {
        setRatio(gen, Math.max(wall, t / d));
        return;
      }
      setRatio(gen, wall);
    }, 50);
  }

  function startBrowserProgress(
    text: string,
    rate: number,
    gen: number,
    resumeFromRatio = 0,
  ) {
    clearProgressTimer();
    const initial = clampSpeakRatio(resumeFromRatio);
    setRatio(gen, initial);
    const durationMs = estimateSpeakDurationMs(text, rate, BROWSER_TTS_CHARS_PER_SEC);
    const startedAt = performance.now() - initial * durationMs;
    progressTimer = window.setInterval(() => {
      if (gen !== speakGen || paused.value) {
        if (gen !== speakGen) clearProgressTimer();
        return;
      }
      setRatio(gen, clampSpeakRatio((performance.now() - startedAt) / durationMs));
    }, 50);
  }

  function pause() {
    if (!speaking.value || paused.value) return false;
    // Still fetching cloud audio — cancel instead of a no-op pause.
    if (progressRatio.value < 0 && !audioEl) {
      stop();
      return true;
    }
    clearProgressTimer();
    if (audioEl) {
      try {
        audioEl.pause();
      } catch {
        /* ignore */
      }
      paused.value = true;
      return true;
    }
    if (speechSynthesisSupported()) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.pause();
        }
      } catch {
        /* ignore */
      }
      paused.value = true;
      return true;
    }
    return false;
  }

  function resume() {
    if (!speaking.value || !paused.value || !active) return false;
    const gen = speakGen;
    const from = progressRatio.value >= 0 ? progressRatio.value : 0;
    paused.value = false;

    if (active.kind === "cloud" && audioEl) {
      const el = audioEl;
      void el
        .play()
        .then(() => {
          if (gen !== speakGen || paused.value) return;
          startMediaProgress(el, active!.text, gen, active!.charsPerSec, active!.rate, from);
        })
        .catch(() => {
          if (gen !== speakGen) return;
          // Cloud element broken — fall back to a fresh browser speak from the start of remaining? Restart full.
          paused.value = false;
          speak(active!.text, active!.companionId);
        });
      return true;
    }

    if (active.kind === "browser" && speechSynthesisSupported()) {
      try {
        window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
      startBrowserProgress(active.text, active.rate, gen, from);
      // Some engines drop paused Chinese utterances — restart cleanly if silent.
      window.setTimeout(() => {
        if (gen !== speakGen || paused.value || !active) return;
        try {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            speak(active.text, active.companionId);
          }
        } catch {
          speak(active.text, active.companionId);
        }
      }, 120);
      return true;
    }
    return false;
  }

  function speakBrowser(text: string, companionId: string | null | undefined, gen: number) {
    if (!speechSynthesisSupported()) {
      if (gen === speakGen) {
        finishIdle(gen);
        error.value = "当前浏览器暂不支持朗读";
      }
      return;
    }

    const profile = voiceProfileFor(companionId);
    const rate = clampRate(profile.rate);
    active = {
      text,
      companionId: companionId || "nuan",
      rate,
      kind: "browser",
      charsPerSec: BROWSER_TTS_CHARS_PER_SEC,
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = rate;
    u.pitch = clampPitch(profile.pitch);
    const voice = pickCompanionVoice(companionId, ensureVoices());
    if (voice) {
      u.voice = voice;
      if (voice.lang) u.lang = voice.lang;
    }

    u.onboundary = (ev) => {
      if (gen !== speakGen || paused.value) return;
      const idx = typeof ev.charIndex === "number" ? ev.charIndex : -1;
      if (idx >= 0 && text.length > 0) {
        setRatio(gen, Math.max(progressRatio.value, idx / text.length));
      }
    };
    u.onend = () => {
      if (gen !== speakGen) return;
      setRatio(gen, 1);
      finishIdle(gen);
    };
    u.onerror = (ev) => {
      if (gen !== speakGen) return;
      finishIdle(gen);
      const code = String((ev as SpeechSynthesisErrorEvent).error || "");
      if (code === "interrupted" || code === "canceled" || code === "cancelled") {
        return;
      }
      error.value = "现在读不了，稍后再试";
    };

    speaking.value = true;
    paused.value = false;
    speakTimer = window.setTimeout(() => {
      speakTimer = null;
      if (gen !== speakGen) return;
      try {
        if (!u.voice) {
          const late = pickCompanionVoice(companionId, ensureVoices());
          if (late) {
            u.voice = late;
            if (late.lang) u.lang = late.lang;
          }
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        startBrowserProgress(text, rate, gen, 0);
        window.speechSynthesis.speak(u);
      } catch {
        if (gen !== speakGen) return;
        finishIdle(gen);
        error.value = "现在读不了，稍后再试";
      }
    }, 80);
  }

  async function speakCloud(text: string, companionId: string | null | undefined, gen: number) {
    speaking.value = true;
    paused.value = false;
    progressRatio.value = -1;
    active = {
      text,
      companionId: companionId || "nuan",
      rate: 1,
      kind: "cloud",
      charsPerSec: CLOUD_TTS_CHARS_PER_SEC,
    };
    const el = new Audio();
    el.preload = "auto";

    try {
      const blob = await synthesizeSpeech(text, companionId || "nuan");
      if (gen !== speakGen) return;
      if (!blob.size) {
        speakBrowser(text, companionId, gen);
        return;
      }

      revokeObjectUrl();
      objectUrl = URL.createObjectURL(blob);
      audioEl = el;
      el.src = objectUrl;

      el.onended = () => {
        if (gen !== speakGen) return;
        setRatio(gen, 1);
        stopCloudAudio(el);
        finishIdle(gen);
      };
      el.onerror = () => {
        if (gen !== speakGen) return;
        clearProgressTimer();
        stopCloudAudio(el);
        speakBrowser(text, companionId, gen);
      };

      await el.play();
      if (gen !== speakGen) {
        stopCloudAudio(el);
        return;
      }
      if (paused.value) return;
      startMediaProgress(el, text, gen, CLOUD_TTS_CHARS_PER_SEC, 1, 0);
    } catch {
      if (gen !== speakGen) return;
      clearProgressTimer();
      stopCloudAudio(el);
      speakBrowser(text, companionId, gen);
    }
  }

  /** Start or restart from the beginning. */
  function speak(text: string, companionId?: string | null) {
    error.value = "";
    let t = text.trim();
    if (!t) return;
    if (t.length > SPEECH_SPEAK_MAX_CHARS) {
      t = `${t.slice(0, SPEECH_SPEAK_MAX_CHARS)}…`;
    }

    stop();
    const gen = (speakGen += 1);
    speaking.value = true;
    paused.value = false;
    progressRatio.value = -1;
    void speakCloud(t, companionId, gen);
  }

  return {
    supported,
    speaking,
    paused,
    progressRatio,
    error,
    clearError,
    speak,
    pause,
    resume,
    stop,
  };
}
