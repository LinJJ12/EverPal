import { ref } from "vue";
import { speechSynthesisSupported, SPEECH_SPEAK_MAX_CHARS } from "@/utils/speech";
import {
  clampPitch,
  clampRate,
  pickCompanionVoice,
  voiceProfileFor,
} from "@/utils/companionVoice";

let voicesListenerAttached = false;

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported();
  const speaking = ref(false);
  const error = ref("");
  let speakTimer: number | null = null;
  /** Bumps on every stop/speak so stale utterance callbacks cannot clobber the new read. */
  let speakGen = 0;

  function clearError() {
    error.value = "";
  }

  function clearSpeakTimer() {
    if (speakTimer !== null) {
      window.clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function ensureVoices(): SpeechSynthesisVoice[] {
    if (!supported) return [];
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

  function stop() {
    clearSpeakTimer();
    speakGen += 1;
    if (!supported) {
      speaking.value = false;
      return;
    }
    try {
      window.speechSynthesis.cancel();
      // Chrome can stay "paused" after cancel and then refuse to speak.
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      /* ignore */
    }
    speaking.value = false;
  }

  function speak(text: string, companionId?: string | null) {
    error.value = "";
    let t = text.trim();
    if (!t) return;
    if (t.length > SPEECH_SPEAK_MAX_CHARS) {
      t = `${t.slice(0, SPEECH_SPEAK_MAX_CHARS)}…`;
    }
    if (!supported) {
      error.value = "当前浏览器暂不支持朗读";
      return;
    }

    // Invalidate previous utterance callbacks, then start a new generation.
    stop();
    const gen = (speakGen += 1);

    const profile = voiceProfileFor(companionId);
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = clampRate(profile.rate);
    u.pitch = clampPitch(profile.pitch);
    const voice = pickCompanionVoice(companionId, ensureVoices());
    if (voice) {
      u.voice = voice;
      if (voice.lang) u.lang = voice.lang;
    }

    u.onend = () => {
      if (gen !== speakGen) return;
      speaking.value = false;
    };
    u.onerror = (ev) => {
      if (gen !== speakGen) return;
      speaking.value = false;
      const code = String((ev as SpeechSynthesisErrorEvent).error || "");
      if (code === "interrupted" || code === "canceled" || code === "cancelled") {
        return;
      }
      error.value = "现在读不了，稍后再试";
    };

    speaking.value = true;
    // Longer delay after cancel — setTimeout(0) is often too soon in Chromium.
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
        window.speechSynthesis.speak(u);
      } catch {
        if (gen !== speakGen) return;
        speaking.value = false;
        error.value = "现在读不了，稍后再试";
      }
    }, 80);
  }

  return { supported, speaking, error, clearError, speak, stop };
}
